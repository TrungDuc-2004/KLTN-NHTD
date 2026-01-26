# KLTN (3-layer): Front-end / Back-end / Database

## 1) Database (MinIO)
- API: http://127.0.0.1:9000
- Console: http://127.0.0.1:9001
- User/Pass: minioadmin / minioadmin

### Windows
Chạy:
- `database/minio/run_minio_windows.ps1`

### Linux/macOS
Chạy:
- `bash database/minio/run_minio_linux.sh`

## 2) Back-end (FastAPI)
Chạy:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API upload duy nhất:
- `POST /admin/minio/file` (multipart/form-data: class_id, type_name, file)

## 3) Front-end (React + Vite)
Chạy:
```bash
cd frontend
npm install
npm run dev
```

Mở: http://localhost:5173
