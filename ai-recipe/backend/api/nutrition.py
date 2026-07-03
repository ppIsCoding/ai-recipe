"""
营养分析API - 带数据库缓存
"""

from __future__ import annotations

import logging
import hashlib

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.tables import NutritionLog
from agents.nutrition_agent import nutrition_agent

router = APIRouter()
logger = logging.getLogger("AIRecipe.API.Nutrition")


class NutritionRequest(BaseModel):
    foods: list[str]


class NutritionFood(BaseModel):
    name: str
    calories: float = 0
    protein: float = 0
    fat: float = 0
    carbs: float = 0
    fiber: float = 0
    vitamins: str = ""


class NutritionResponse(BaseModel):
    success: bool
    foods: list[NutritionFood] = []
    total: dict = {}
    health_advice: str = ""
    recommended_recipes: list[str] = []
    from_cache: bool = False
    error: str = ""


def get_foods_key(foods: list[str]) -> str:
    """生成食材组合的hash key"""
    sorted_foods = sorted(foods)
    key_str = ",".join(sorted_foods)
    return hashlib.md5(key_str.encode()).hexdigest()


def format_nutrition_data(nutrition_data: list) -> list[NutritionFood]:
    """格式化营养数据"""
    foods_nutrition = []
    for item in nutrition_data:
        if isinstance(item, dict):
            foods_nutrition.append(
                NutritionFood(
                    name=item.get("name", ""),
                    calories=item.get("calories", 0),
                    protein=item.get("protein", 0),
                    fat=item.get("fat", 0),
                    carbs=item.get("carbs", 0),
                    fiber=item.get("fiber", 0),
                    vitamins=item.get("vitamins", ""),
                )
            )
    return foods_nutrition


@router.post("/nutrition/analyze", response_model=NutritionResponse)
async def analyze_nutrition(req: NutritionRequest, db: Session = Depends(get_db)):
    """营养分析接口 - 优先从缓存读取"""
    try:
        if not req.foods:
            return NutritionResponse(success=False, error="请提供食材列表")

        # 生成缓存key
        foods_key = get_foods_key(req.foods)
        logger.info(f"🥗 营养分析请求 - 食材: {req.foods}, key: {foods_key}")

        # 查询数据库缓存
        cached = db.query(NutritionLog).filter(NutritionLog.foods_key == foods_key).first()

        if cached:
            # 缓存命中，直接返回
            logger.info(f"✅ 缓存命中，直接返回缓存数据")
            foods_data = cached.foods or []
            return NutritionResponse(
                success=True,
                foods=format_nutrition_data(foods_data),
                total={
                    "calories": cached.total_calories,
                    "protein": cached.total_protein,
                    "fat": cached.total_fat,
                    "carbs": cached.total_carbs,
                },
                health_advice=cached.health_advice or "",
                recommended_recipes=cached.recommended_recipes or [],
                from_cache=True,
            )

        # 缓存未命中，调用AI分析
        logger.info(f"🔄 缓存未命中，调用AI分析...")
        result = await nutrition_agent.ainvoke(
            {
                "foods": req.foods,
                "nutrition_data": [],
                "total_nutrition": {},
                "health_advice": "",
                "recommended_recipes": [],
            }
        )

        nutrition_data = result.get("nutrition_data", [])
        total = result.get("total_nutrition", {})
        advice = result.get("health_advice", "")
        recipes = result.get("recommended_recipes", [])

        # 保存到数据库缓存
        try:
            log = NutritionLog(
                foods_key=foods_key,
                foods=nutrition_data,
                total_calories=total.get("calories", 0),
                total_protein=total.get("protein", 0),
                total_fat=total.get("fat", 0),
                total_carbs=total.get("carbs", 0),
                health_advice=advice,
                recommended_recipes=recipes,
            )
            db.add(log)
            db.commit()
            logger.info(f"💾 已保存到数据库缓存")
        except Exception as e:
            db.rollback()
            logger.error(f"保存营养缓存失败: {e}")

        return NutritionResponse(
            success=True,
            foods=format_nutrition_data(nutrition_data),
            total=total,
            health_advice=advice,
            recommended_recipes=recipes,
            from_cache=False,
        )
    except Exception as e:
        logger.error(f"营养分析失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
