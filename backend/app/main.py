from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.db.postgres import pg
from app.routers.admin_minio_upload_file import router as upload_router
from app.routers.auth import router as auth_router

app = FastAPI(title="KLTN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await pg.connect()

@app.on_event("shutdown")
async def on_shutdown():
    await pg.close()

app.include_router(auth_router)
app.include_router(upload_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "API is running"}
