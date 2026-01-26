from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException

from app.core.config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_SECURE,
    MINIO_PUBLIC_BASE_URL,
)

minio_client = Minio(
    endpoint=MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE,
)

def ensure_bucket(bucket: str) -> None:
    try:
        if not minio_client.bucket_exists(bucket):
            minio_client.make_bucket(bucket)
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"MinIO bucket error: {e.code} - {e.message}")

def build_public_url(bucket: str, obj: str) -> str | None:
    if not MINIO_PUBLIC_BASE_URL:
        return None
    base = MINIO_PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/{bucket}/{obj}"
