from fastapi import APIRouter, Depends, Query

from app.deps import require_admin
from app.services.minio_paths import TypeName
from app.services.minio_service import list_files

router = APIRouter(prefix="/admin/minio", tags=["MinIO"])

@router.get("/files")
def list_admin_files(
    class_id: str = Query(..., description="Lớp: 10/11/12"),
    type_name: TypeName = Query(..., description="subject|topic|lesson|chunk|keyword"),
    recursive: bool = Query(True),
    limit: int = Query(500, ge=1, le=5000),
   ## _claims=Depends(require_admin),   # bắt buộc admin (đúng flow login của bạn)
):
    return list_files(class_id=class_id, type_name=type_name, recursive=recursive, limit=limit)
