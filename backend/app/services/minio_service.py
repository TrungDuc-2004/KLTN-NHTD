from fastapi import HTTPException
from minio.error import S3Error

from app.db.minio_client import minio_client, ensure_bucket, build_public_url
from app.services.minio_paths import bucket_from_class_id, make_object_name, TypeName, TYPE_PREFIX
from app.core.config import PART_SIZE_BYTES

def upload_one(class_id: str, type_name: TypeName, filename: str, fileobj, content_type: str, size_bytes: int):
    # 1) bucket theo class_id
    bucket = bucket_from_class_id(class_id)
    ensure_bucket(bucket)

    # 2) object_name theo type_name
    object_name = make_object_name(type_name, filename)
    prefix = TYPE_PREFIX[type_name]

    try:
        # 3) upload streaming (multipart)
        minio_client.put_object(
            bucket_name=bucket,
            object_name=object_name,
            data=fileobj,
            length=-1,
            part_size=PART_SIZE_BYTES,
            content_type=content_type or "application/octet-stream",
        )
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"MinIO put_object error: {e.code} - {e.message}")

    public_url = build_public_url(bucket, object_name)

    return {
        "bucket": bucket,
        "type_name": type_name,
        "prefix": prefix,
        "object_name": object_name,
        "original_filename": filename,
        "content_type": content_type or "application/octet-stream",
        "size_bytes": size_bytes,
        "public_url": public_url,
        "status": "ok",
    }
