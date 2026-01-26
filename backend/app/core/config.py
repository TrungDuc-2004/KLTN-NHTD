import os
from dotenv import load_dotenv

# Load .env nếu có
load_dotenv()

def _to_bool(v: str, default: bool=False) -> bool:
    if v is None:
        return default
    return str(v).strip().lower() in ("1","true","yes","y","on")

APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("APP_PORT", "8000"))

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "127.0.0.1:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = _to_bool(os.getenv("MINIO_SECURE", "false"), default=False)

MINIO_PUBLIC_BASE_URL = (os.getenv("MINIO_PUBLIC_BASE_URL") or "").strip() or None
MINIO_BUCKET_PREFIX = os.getenv("MINIO_BUCKET_PREFIX", "class-")

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_EXTS = [e.strip().lower() for e in (os.getenv("ALLOWED_EXTS", "pdf,txt,png,jpg,jpeg,docx").split(",")) if e.strip()]

PART_SIZE_MB = int(os.getenv("PART_SIZE_MB", "10"))
PART_SIZE_BYTES = PART_SIZE_MB * 1024 * 1024
