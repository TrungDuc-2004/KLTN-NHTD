from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.admin_minio_upload_file import router as upload_router

app = FastAPI(title="Upload → MinIO (Only Upload API)")

# Cho phép FE (mở file html trực tiếp) gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Upload API is running"}

