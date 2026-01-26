import os
from fastapi import HTTPException
from app.core.config import ALLOWED_EXTS, MAX_FILE_SIZE_BYTES

def validate_filename(filename: str) -> None:
    if not filename:
        raise HTTPException(status_code=400, detail="File name is empty")

def validate_extension(filename: str) -> None:
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension not allowed. Allowed: {', '.join(ALLOWED_EXTS)}",
        )

def validate_size(size_bytes: int) -> None:
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max: {MAX_FILE_SIZE_BYTES} bytes",
        )
