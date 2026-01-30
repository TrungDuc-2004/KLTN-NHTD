from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse, unquote

import anyio
from minio.error import S3Error

from app.db.minio_client import minio_client


def file_ext_from_url(url: str) -> str:
    """Lấy type file theo đuôi URL (pdf, png...)."""
    if not url:
        return "unknown"
    path = urlparse(url).path
    path = unquote(path)
    if "." not in path:
        return "unknown"
    return (path.rsplit(".", 1)[-1] or "unknown").lower()


def parse_minio_public_url(url: str) -> Tuple[Optional[str], Optional[str]]:
    """
    URL dạng: http://127.0.0.1:9000/class-10/subjects/xxx.pdf
    -> bucket = class-10
    -> object_name = subjects/xxx.pdf
    """
    if not url:
        return None, None
    path = unquote(urlparse(url).path).lstrip("/")
    if not path or "/" not in path:
        return None, None
    bucket, obj = path.split("/", 1)
    return bucket, obj


async def stat_from_public_url(url: str) -> Tuple[Optional[int], Optional[datetime]]:
    """Lấy size + last_modified từ MinIO (stat_object) dựa trên public_url."""
    bucket, obj = parse_minio_public_url(url)
    if not bucket or not obj:
        return None, None

    try:
        stat = await anyio.to_thread.run_sync(minio_client.stat_object, bucket, obj)
        size = getattr(stat, "size", None)
        last_modified = getattr(stat, "last_modified", None)
        return size, last_modified
    except S3Error:
        return None, None
    except Exception:
        return None, None


def _dt_to_iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    # trường hợp lưu string ISO trong Mongo
    if isinstance(dt, str):
        try:
            return datetime.fromisoformat(dt.replace("Z", "+00:00")).isoformat()
        except Exception:
            return None
    return None


def _sanitize(obj: Any) -> Any:
    """Chuyển ObjectId/datetime/nested thành JSON-safe."""
    try:
        from bson import ObjectId
    except Exception:
        ObjectId = None  # type: ignore

    if ObjectId is not None and isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


async def build_list_item(doc: Dict[str, Any], type_name: str) -> Optional[Dict[str, Any]]:
    """
    Output cho FE list:
    - name: lấy từ mongo theo key <type>_name (vd subject_name)
    - file_type: theo đuôi url
    - size_bytes: stat minio
    - last_updated: ưu tiên doc.updated_at, fallback minio last_modified
    """
    type_name = (type_name or "").strip().lower()
    name_key = f"{type_name}_name"
    url_key = f"{type_name}_url"

    url = doc.get(url_key) or doc.get("url")
    if not url:
        return None

    size_bytes, last_modified = await stat_from_public_url(url)

    updated_at_iso = _dt_to_iso(doc.get("updated_at")) or _dt_to_iso(last_modified)
    name = doc.get(name_key) or doc.get("name") or ""

    return {
        "id": str(doc.get("_id")),
        "name": name,
        "url": url,
        "file_type": file_ext_from_url(url),
        "size_bytes": size_bytes,
        "last_updated": updated_at_iso,
    }


async def build_detail_item(doc: Dict[str, Any], type_name: str) -> Dict[str, Any]:
    type_name = (type_name or "").strip().lower()
    name_key = f"{type_name}_name"
    url_key = f"{type_name}_url"

    url = doc.get(url_key) or doc.get("url")
    size_bytes, last_modified = await stat_from_public_url(url) if url else (None, None)

    updated_at_iso = _dt_to_iso(doc.get("updated_at")) or _dt_to_iso(last_modified)
    created_at_iso = _dt_to_iso(doc.get("created_at"))

    return {
        "id": str(doc.get("_id")),
        "type_name": type_name,
        "name": doc.get(name_key) or doc.get("name") or "",
        "url": url,
        "file_type": file_ext_from_url(url or ""),
        "size_bytes": size_bytes,
        "last_updated": updated_at_iso,
        "created_at": created_at_iso,
        "mongo": _sanitize(doc),
    }
