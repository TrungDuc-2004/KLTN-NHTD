from __future__ import annotations

from typing import Optional, Dict, Any

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException

from app.deps import require_admin
from app.services.minio_paths import TypeName
from app.services.minio_service import upload_one
from app.services.mongo_metadata_service import parse_metadata, upsert_entity_metadata
from app.utils.validators import validate_extension, validate_size

router = APIRouter(prefix="/admin/minio", tags=["MinIO"])

ALLOWED_CLASSES = {"10", "11", "12"}
ALLOWED_TYPES = {"subject", "topic", "lesson", "chunk"}


def slim_doc(doc: Dict[str, Any], type_name: str) -> Dict[str, Any]:
    """
    CHỈ lọc bớt field trong response (không thay đổi document trong Mongo).
    Output giống mẫu bạn muốn: _id, <type>_id, <type>_name, <type>_url, created_at, updated_at
    """
    if not isinstance(doc, dict):
        return {}

    t = (type_name or "").strip().lower()
    id_key = f"{t}_id"
    name_key = f"{t}_name"
    url_key = f"{t}_url"

    out: Dict[str, Any] = {}

    # _id (nếu backend đã stringify thì giữ luôn)
    if "_id" in doc:
        out["_id"] = doc["_id"]

    # id / name
    if id_key in doc and doc[id_key] is not None:
        out[id_key] = doc[id_key]
    if name_key in doc and doc[name_key] is not None:
        out[name_key] = doc[name_key]

    # url: ưu tiên <type>_url; nếu không có thì fallback từ url
    if url_key in doc and doc[url_key]:
        out[url_key] = doc[url_key]
    elif doc.get("url"):
        out[url_key] = doc["url"]

    # timestamps
    if "created_at" in doc:
        out["created_at"] = doc["created_at"]
    if "updated_at" in doc:
        out["updated_at"] = doc["updated_at"]

    return out


@router.post("/file")
async def upload_admin_file(
    # format mới
    class_: Optional[str] = Form(None, alias="class"),
    type_: Optional[TypeName] = Form(None, alias="type"),
    metadata: Optional[str] = Form(None, alias="metadata"),

    # tương thích ngược
    class_id: Optional[str] = Form(None),
    type_name: Optional[TypeName] = Form(None),
    metadata_json: Optional[str] = Form(None),

    file: UploadFile = File(...),
    _claims=Depends(require_admin),
):
    final_class = (class_ or class_id or "").strip()
    final_type = (type_ or type_name or "").strip().lower()
    raw_metadata = metadata if metadata is not None else (metadata_json if metadata_json is not None else "{}")

    if final_class not in ALLOWED_CLASSES:
        raise HTTPException(status_code=400, detail="class phải là 10/11/12")

    if final_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="type phải là subject/topic/lesson/chunk")

    if not file.filename:
        raise HTTPException(status_code=400, detail="File rỗng hoặc không hợp lệ")

    filename = file.filename
    validate_extension(filename)

    file.file.seek(0, 2)
    size_bytes = file.file.tell()
    file.file.seek(0)

    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="File rỗng hoặc không hợp lệ")

    validate_size(size_bytes)

    # 1) upload minio
    minio_res = upload_one(
        class_id=final_class,
        type_name=final_type,
        filename=filename,
        fileobj=file.file,
        content_type=file.content_type or "",
        size_bytes=size_bytes,
    )

    # 2) parse metadata
    meta_obj = parse_metadata(raw_metadata)

    # 3) upsert mongo (service tự gắn url vào document trong Mongo như hiện tại)
    mongo_res = await upsert_entity_metadata(
        class_id=final_class,
        type_name=final_type,
        metadata=meta_obj,
        minio_info=minio_res,
        created_by=str(_claims.get("sub") or "admin"),
    )

    full_doc = mongo_res.get("document") or {}
    slim = slim_doc(full_doc, final_type)

    return {
        "minio": minio_res,  # giữ nguyên như cũ
        "mongo": {
            "collection": mongo_res["collection"],
            "document": slim,  # ✅ response gọn như bạn muốn
        },
    }
