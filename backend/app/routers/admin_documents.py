from __future__ import annotations

from typing import Any, Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import require_admin
from app.db.mongo_client import get_mongo_db
from app.services.mongo_metadata_service import COLLECTION_MAP
from app.services.document_view_service import build_list_item, build_detail_item

router = APIRouter(prefix="/admin/documents", tags=["Documents (Mongo)"])


@router.get("")
async def list_documents(
    class_id: str = Query(..., description="10/11/12/all"),
    type_name: str = Query(..., description="subject|topic|lesson|chunk|keyword|all"),
    q: str = Query("", description="search theo name/url"),
    limit: int = Query(500, ge=1, le=5000),
    _claims=Depends(require_admin),
):
    db = get_mongo_db()

    class_id_norm = (class_id or "").strip().lower()
    type_name_norm = (type_name or "").strip().lower()
    kw = (q or "").strip()

    # ✅ types cần query
    if type_name_norm == "all":
        types_to_query = list(COLLECTION_MAP.keys())
    elif type_name_norm in COLLECTION_MAP:
        types_to_query = [type_name_norm]
    else:
        raise HTTPException(status_code=400, detail="type_name không hợp lệ")

    all_items: List[Dict[str, Any]] = []

    for t in types_to_query:
        coll = db[COLLECTION_MAP[t]]
        name_key = f"{t}_name"
        url_key = f"{t}_url"

        flt: Dict[str, Any] = {
            "type_name": t,
            "status": {"$ne": "deleted"},
        }

        # ✅ class_id = all -> không lọc
        if class_id_norm != "all":
            flt["class_id"] = str(class_id)

        # ✅ search
        if kw:
            flt["$or"] = [
                {name_key: {"$regex": kw, "$options": "i"}},
                {url_key: {"$regex": kw, "$options": "i"}},
            ]

        cursor = coll.find(flt).sort("updated_at", -1).limit(int(limit))

        async for doc in cursor:
            it = await build_list_item(doc, t)
            if it:
                # ✅ để FE biết item thuộc loại nào (quan trọng khi type_name=all)
                it["type_name"] = t
                all_items.append(it)

    # ✅ sort chung theo last_updated (ISO string) mới nhất
    all_items.sort(key=lambda x: x.get("last_updated") or "", reverse=True)

    return {"count": len(all_items), "items": all_items}


@router.get("/{doc_id}")
async def get_document_detail(
    doc_id: str,
    type_name: str = Query("", description="subject|topic|lesson|chunk|keyword (rỗng sẽ tự dò)"),
    _claims=Depends(require_admin),
):
    db = get_mongo_db()

    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="doc_id không hợp lệ")

    tn = (type_name or "").strip().lower()

    # ✅ có type_name -> đọc đúng collection cho nhanh
    if tn:
        if tn not in COLLECTION_MAP:
            raise HTTPException(status_code=400, detail="type_name không hợp lệ")
        coll = db[COLLECTION_MAP[tn]]
        doc = await coll.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        return await build_detail_item(doc, tn)

    # ✅ không truyền type_name -> dò tất cả collection
    for k, coll_name in COLLECTION_MAP.items():
        coll = db[coll_name]
        doc = await coll.find_one({"_id": oid})
        if doc:
            return await build_detail_item(doc, k)

    raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
