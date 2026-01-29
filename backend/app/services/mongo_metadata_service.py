import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from fastapi import HTTPException
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from app.db.mongo_client import get_mongo_db

COLLECTION_MAP = {
    "subject": "subjects",
    "topic": "topics",
    "lesson": "lessons",
    "chunk": "chunks",
    "keyword": "keywords",
}


def parse_metadata(metadata_json: str | None) -> Dict[str, Any]:
    if not metadata_json:
        return {}
    try:
        obj = json.loads(metadata_json)
        if not isinstance(obj, dict):
            raise ValueError("metadata_json phải là JSON object")
        return obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"metadata_json không hợp lệ: {e}")


async def upsert_entity_metadata(
    *,
    class_id: str,
    type_name: str,
    metadata: Dict[str, Any],
    minio_info: Dict[str, Any],
    created_by: str = "admin",
) -> Dict[str, Any]:
    type_name = (type_name or "").strip().lower()
    if type_name not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"type_name không hợp lệ: {type_name}")

    coll_name = COLLECTION_MAP[type_name]
    db = get_mongo_db()
    coll = db[coll_name]

    now = datetime.now(timezone.utc)

    # ✅ BỎ topic_id (theo yêu cầu của bạn)
    # (dù FE có gửi topic_id thì cũng bỏ)
    if type_name == "topic":
        metadata.pop("topic_id", None)

    # auto name nếu chưa nhập (vd topic_name/lesson_name)
    name_key = f"{type_name}_name"
    if not metadata.get(name_key):
        filename = (minio_info.get("original_filename") or "").strip()
        if filename:
            metadata[name_key] = Path(filename).stem

    # url theo type (vd topic_url)
    url_key = f"{type_name}_url"
    public_url = minio_info.get("public_url")
    metadata[url_key] = public_url

    # ✅ BỎ hẳn field "file" (không lưu nữa)
    metadata.pop("file", None)

    # filter upsert: dùng url (ổn định) thay vì file.object_name
    flt = {
        "class_id": class_id,
        "type_name": type_name,
        url_key: public_url,
    }

    doc_set = dict(metadata)
    doc_set.update(
        {
            "class_id": class_id,
            "type_name": type_name,
            "updated_at": now,
            "status": "active",
            "updated_by": created_by,
        }
    )

    try:
        after = await coll.find_one_and_update(
            flt,
            {"$set": doc_set, "$setOnInsert": {"created_at": now, "created_by": created_by}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {e}")

    if after and "_id" in after:
        after["_id"] = str(after["_id"])

    return {"collection": coll_name, "document": after}
