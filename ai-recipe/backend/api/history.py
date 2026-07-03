"""
做菜历史API
"""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.database import get_db
from models.tables import CookHistory, Recipe

router = APIRouter()
logger = logging.getLogger("AIRecipe.API.History")


class CookHistoryRequest(BaseModel):
    user_id: str = "default"
    recipe_id: int
    recipe_name: str = ""
    cook_time: int = 0
    rating: int = 5
    note: str = ""


class CookHistoryItem(BaseModel):
    id: int
    recipe_id: int
    recipe_name: str
    cook_time: int
    rating: int
    note: str
    created_at: str
    image_url: str = ""


class CookHistoryResponse(BaseModel):
    success: bool
    history: list[CookHistoryItem] = []
    total: int = 0


@router.post("/history", response_model=dict)
async def add_cook_history(req: CookHistoryRequest, db: Session = Depends(get_db)):
    """添加做菜记录"""
    try:
        record = CookHistory(
            user_id=req.user_id,
            recipe_id=req.recipe_id,
            recipe_name=req.recipe_name,
            cook_time=req.cook_time,
            rating=req.rating,
            note=req.note,
        )
        db.add(record)
        db.commit()
        return {"success": True, "message": "记录成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=CookHistoryResponse)
async def get_cook_history(
    user_id: str = "default", page: int = 1, page_size: int = 20, db: Session = Depends(get_db)
):
    """获取做菜历史"""
    try:
        total = db.query(CookHistory).filter(CookHistory.user_id == user_id).count()
        records = (
            db.query(CookHistory)
            .filter(CookHistory.user_id == user_id)
            .order_by(desc(CookHistory.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # 批量查询菜谱图片
        recipe_ids = list(set(r.recipe_id for r in records))
        recipe_images = {}
        if recipe_ids:
            recipes = db.query(Recipe).filter(Recipe.id.in_(recipe_ids)).all()
            recipe_images = {r.id: r.image_url or "" for r in recipes}

        history = []
        for r in records:
            history.append(
                CookHistoryItem(
                    id=r.id,
                    recipe_id=r.recipe_id,
                    recipe_name=r.recipe_name,
                    cook_time=r.cook_time,
                    rating=r.rating,
                    note=r.note or "",
                    created_at=r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
                    image_url=recipe_images.get(r.recipe_id, ""),
                )
            )

        return CookHistoryResponse(success=True, history=history, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{record_id}")
async def delete_cook_history(record_id: int, user_id: str = "default", db: Session = Depends(get_db)):
    """删除做菜记录"""
    try:
        record = (
            db.query(CookHistory)
            .filter(CookHistory.id == record_id, CookHistory.user_id == user_id)
            .first()
        )
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")

        db.delete(record)
        db.commit()
        return {"success": True, "message": "已删除"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
