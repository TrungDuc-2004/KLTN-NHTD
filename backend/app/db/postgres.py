from typing import Optional
import asyncpg

from app.core.config import PG_HOST, PG_PORT, PG_DB, PG_USER, PG_PASSWORD

class Postgres:
    def __init__(self) -> None:
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self) -> None:
        if self.pool is not None:
            return
        self.pool = await asyncpg.create_pool(
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD,
            min_size=1,
            max_size=10,
        )

    async def close(self) -> None:
        if self.pool is None:
            return
        await self.pool.close()
        self.pool = None

pg = Postgres()
