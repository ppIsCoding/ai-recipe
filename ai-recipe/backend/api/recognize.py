"""
食材识别 API
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.recognition_agent import recognition_agent

logger = logging.getLogger("AIRecipe.Recognize")

router = APIRouter()


class RecognizeRequest(BaseModel):
    image_base64: str
    user_id: str = "default"


class FoodItem(BaseModel):
    name: str
    category: str = "其他"
    shelf_life_days: int = 3
    probability: float = 0.9


class RecognizeResponse(BaseModel):
    success: bool
    foods: list[FoodItem]
    count: int
    error: str = ""


@router.post("/recognize", response_model=RecognizeResponse)
async def recognize_food(req: RecognizeRequest):
    """
    食材识别接口
    接收图片base64，返回识别到的食材列表
    """
    logger.info(f"📸 收到食材识别请求 - 用户ID: {req.user_id}")
    logger.info(f"🖼️  图片大小: {len(req.image_base64)} bytes")
    
    try:
        logger.info("🤖 调用 Recognition Agent 处理...")
        result = await recognition_agent.ainvoke(
            {
                "image_base64": req.image_base64,
                "analyzed_foods": [],
                "final_foods": [],
                "error": "",
            }
        )

        foods = result.get("final_foods", [])
        error = result.get("error", "")

        if error:
            logger.warning(f"⚠️  识别过程出现警告: {error}")
        
        logger.info(f"🥗 识别到 {len(foods)} 个食材")
        if foods:
            food_names = [f['name'] for f in foods[:5]]
            logger.info(f"📋 食材列表: {', '.join(food_names)}{'...' if len(foods) > 5 else ''}")
        
        logger.info(f"✅ 食材识别请求处理成功")

        return RecognizeResponse(
            success=len(foods) > 0,
            foods=foods,
            count=len(foods),
            error=error,
        )
    except Exception as e:
        logger.error(f"❌ 食材识别请求处理失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
