import re
from typing import Literal, Dict
from fastapi import HTTPException
from app.core.config import MINIO_BUCKET_PREFIX

TypeName = Literal["subject", "topic", "lesson", "chunk", "keyword"]

# Đúng cấu trúc bạn yêu cầu
TYPE_PREFIX: Dict[str, str] = {
    "subject": "subjects/",
    "topic": "subjects/topics/",
    "lesson": "subjects/topics/lessons/",
    "chunk": "subjects/topics/lessons/chunks/",
    "keyword": "subjects/topics/lessons/chunks/keywords/",
}

SAFE_FILENAME_RE = re.compile(r"^[^/\\]+$")

def bucket_from_class_id(class_id: str) -> str:
    class_id = str(class_id).strip()
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")
    return f"{MINIO_BUCKET_PREFIX}{class_id}"

def make_object_name(type_name: TypeName, filename: str) -> str:
    if type_name not in TYPE_PREFIX:
        raise HTTPException(status_code=400, detail=f"Invalid type_name: {type_name}")
    if not filename or not SAFE_FILENAME_RE.match(filename):
        raise HTTPException(status_code=400, detail="Invalid filename (must not contain / or \\\")")
    return f"{TYPE_PREFIX[type_name]}{filename}"
