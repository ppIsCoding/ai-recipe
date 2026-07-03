"""
收藏API
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.tables import Favorite, Recipe

router = APIRouter()
logger = logging.getLogger("AIRecipe.API.Favorites")


class FavoriteRequest(BaseModel):
    user_id: str = "default"
    recipe_id: int


class FavoriteResponse(BaseModel):
    success: bool
    is_favorite: bool = False
    message: str = ""


class FavoriteRecipeItem(BaseModel):
    id: int
    name: str
    image_url: str = ""
    description: str = ""
    difficulty: str = "简单"
    cook_time: str = ""


class FavoriteListResponse(BaseModel):
    success: bool
    favorites: list[FavoriteRecipeItem] = []


@router.post("/favorites", response_model=FavoriteResponse)
async def toggle_favorite(req: FavoriteRequest, db: Session = Depends(get_db)):
    """切换收藏状态"""
    try:
        existing = (
            db.query(Favorite)
            .filter(Favorite.user_id == req.user_id, Favorite.recipe_id == req.recipe_id)
            .first()
        )

        if existing:
            db.delete(existing)
            db.commit()
            return FavoriteResponse(success=True, is_favorite=False, message="已取消收藏")
        else:
            fav = Favorite(user_id=req.user_id, recipe_id=req.recipe_id)
            db.add(fav)
            db.commit()
            return FavoriteResponse(success=True, is_favorite=True, message="已收藏")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/favorites", response_model=FavoriteListResponse)
async def get_favorites(user_id: str = "default", db: Session = Depends(get_db)):
    """获取收藏列表"""
    try:
        favs = db.query(Favorite).filter(Favorite.user_id == user_id).all()
        recipe_ids = [f.recipe_id for f in favs]
        
        # 关联查询菜谱详情
        recipes = []
        if recipe_ids:
            recipe_records = db.query(Recipe).filter(Recipe.id.in_(recipe_ids)).all()
            for r in recipe_records:
                recipes.append(FavoriteRecipeItem(
                    id=r.id,
                    name=r.name,
                    image_url=r.image_url or "",
                    description=r.description or "",
                    difficulty=r.difficulty or "简单",
                    cook_time=r.cook_time or "",
                ))
        
        return FavoriteListResponse(success=True, favorites=recipes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/favorites/check")
async def check_favorite(user_id: str = "default", recipe_id: int = 0, db: Session = Depends(get_db)):
    """检查是否已收藏"""
    try:
        existing = (
            db.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.recipe_id == recipe_id)
            .first()
        )
        return {"success": True, "is_favorite": existing is not None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
