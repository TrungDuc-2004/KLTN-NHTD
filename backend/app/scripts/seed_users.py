import asyncio
import asyncpg

from app.core.config import POSTGRES_DSN
from app.security import hash_password

async def upsert_user(username: str, full_name: str, class_name: str, role: str, password: str):
    conn = await asyncpg.connect(POSTGRES_DSN)
    try:
        pw_hash = hash_password(password)
        # Nếu username đã tồn tại thì update password/role/full_name/class_name
        await conn.execute(
            """
            INSERT INTO users (username, full_name, class_name, role, password_hash, date_of_birth)
            VALUES ($1, $2, $3, $4::user_role, $5, '2000-01-01')
            ON CONFLICT (username)
            DO UPDATE SET
              full_name = EXCLUDED.full_name,
              class_name = EXCLUDED.class_name,
              role = EXCLUDED.role,
              password_hash = EXCLUDED.password_hash
            """,
            username, full_name, class_name, role, pw_hash
        )
    finally:
        await conn.close()

async def main():
    await upsert_user("admin", "Admin", "A1", "admin", "123")
    await upsert_user("user", "User", "A1", "user", "123")
    print("Seed OK: admin/123 và user/123")

if __name__ == "__main__":
    asyncio.run(main())
