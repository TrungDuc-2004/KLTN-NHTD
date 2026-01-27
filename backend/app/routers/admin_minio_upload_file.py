from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.auth import require_admin


from app.services.minio_paths import TypeName
from app.services.minio_service import upload_one
from app.utils.validators import validate_extension, validate_size
from app.deps import require_admin

router = APIRouter(prefix="/admin/minio", tags=["MinIO"])

@router.post("/file")
async def upload_admin_file(
    class_id: str = Form(...),
    type_name: TypeName = Form(...),
    file: UploadFile = File(...),
   # _claims=Depends(require_admin),  # <-- THÊM: bắt buộc admin
):
    """
    Upload 1 file lên MinIO (admin)

    - Bucket: class-{class_id}
    - Path: theo type_name (subjects/topics/lessons/chunks/keywords)
    """
    # THÊM: check filename rỗng
    if not file.filename:
        raise HTTPException(status_code=400, detail="File rỗng hoặc không hợp lệ")

    filename = file.filename

    # Validate extension
    validate_extension(filename)

    # Tính size file (để kiểm tra giới hạn)
    file.file.seek(0, 2)  # end
    size_bytes = file.file.tell()
    file.file.seek(0)

    # THÊM: check file rỗng
    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="File rỗng hoặc không hợp lệ")

    validate_size(size_bytes)

    return upload_one(
        class_id=class_id,
        type_name=type_name,
        filename=filename,
        fileobj=file.file,
        content_type=file.content_type or "",
        size_bytes=size_bytes,
    )
