from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import MONGO_URI, MONGO_DB

_client = AsyncIOMotorClient(MONGO_URI)
_db: AsyncIOMotorDatabase = _client[MONGO_DB]


def get_mongo_db() -> AsyncIOMotorDatabase:
    return _db


def get_collection(name: str):
    return _db[name]


async def ping_mongo() -> None:
    # ✅ ping để kiểm tra Mongo sống
    await _db.command("ping")


def close_mongo():
    _client.close()
