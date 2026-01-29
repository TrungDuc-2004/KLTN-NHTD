import os
from pathlib import Path
from dotenv import load_dotenv

# ✅ luôn load .env trong thư mục backend (ổn định dù chạy uvicorn ở đâu)
BACKEND_DIR = Path(__file__).resolve().parents[2]  # .../backend
load_dotenv(BACKEND_DIR / ".env")

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

# ===== PostgreSQL =====
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "Data")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "")

# ===== MongoDB =====
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "kltn")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "minio_files")

# ===== JWT =====
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# ===== CORS =====
_CORS_RAW = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [x.strip() for x in _CORS_RAW.split(",") if x.strip()] or ["*"]
