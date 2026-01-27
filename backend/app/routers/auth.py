from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.db.postgres import pg
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    if pg.pool is None:
        raise HTTPException(status_code=500, detail="Postgres pool chưa được khởi tạo")

    async with pg.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT user_id, username, full_name, role::text AS role, password_hash
            FROM users
            WHERE username = $1
            """,
            payload.username,
        )

    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tài khoản hoặc mật khẩu")

    claims = {
        "sub": row["username"],
        "user_id": str(row["user_id"]),
        "role": row["role"],
        "full_name": row["full_name"],
    }
    token = create_access_token(claims)

    return TokenResponse(
        access_token=token,
        role=row["role"],
        full_name=row["full_name"],
    )
