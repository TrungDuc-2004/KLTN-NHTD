from fastapi import APIRouter, UploadFile, File, Form
from app.services.minio_paths import TypeName
from app.services.minio_service import upload_one
from app.utils.validators import validate_extension, validate_size

router = APIRouter(prefix="/admin/minio", tags=["MinIO"])

@router.post("/file")
async def upload_admin_file(
    class_id: str = Form(...),
    type_name: TypeName = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload 1 file lên MinIO

    - Bucket: class-{class_id}
    - Path: theo type_name (subjects/topics/lessons/chunks/keywords)
    """
    filename = file.filename or "unnamed.bin"

    # Validate extension
    validate_extension(filename)

    # Tính size file (để kiểm tra giới hạn)
    # UploadFile.file là SpooledTemporaryFile -> có seek
    file.file.seek(0, 2)  # end
    size_bytes = file.file.tell()
    file.file.seek(0)

    validate_size(size_bytes)

    return upload_one(
        class_id=class_id,
        type_name=type_name,
        filename=filename,
        fileobj=file.file,
        content_type=file.content_type or "",
        size_bytes=size_bytes,
    )
