# Chạy MinIO (Database layer) và lưu dữ liệu vào ./data
# Yêu cầu: minio.exe có trong PATH (hoặc đặt minio.exe cùng thư mục này)

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$DATA_DIR = Join-Path $ROOT "data"

$env:MINIO_ROOT_USER = "minioadmin"
$env:MINIO_ROOT_PASSWORD = "minioadmin"

minio server $DATA_DIR --console-address ":9001"
