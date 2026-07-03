"""
菜谱推荐 API
基于《中国居民膳食指南2022》的健康菜谱推荐
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agents.recipe_agent import recipe_agent
from models.database import get_db
from models.tables import Recipe, User

logger = logging.getLogger("AIRecipe.Recipe")

router = APIRouter()


def _recipe_to_item(recipe) -> RecipeItem:
    """将 ORM Recipe 对象转换为 RecipeItem 响应模型"""
    return RecipeItem(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description or "",
        difficulty=recipe.difficulty or "简单",
        cook_time=recipe.cook_time or "",
        servings=recipe.servings or "",
        main_ingredients=recipe.main_ingredients or [],
        ingredients=recipe.ingredients or [],
        steps=recipe.steps or [],
        nutrition=recipe.nutrition or {},
        image_url=recipe.image_url or "",
        category=recipe.category or "家常菜",
        health_tags=recipe.health_tags or [],
    )


def _build_user_profile(user: User) -> dict:
    """从用户信息构建健康档案"""
    profile = {}
    
    if user.weight and user.height and user.age and user.gender:
        weight = float(user.weight)
        height = float(user.height)
        age = user.age
        gender = user.gender
        
        # 计算BMI
        height_m = height / 100
        bmi = weight / (height_m * height_m)
        profile["bmi"] = round(bmi, 1)
        
        # 计算BMR (Mifflin-St Jeor公式)
        if gender == "male":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        profile["bmr"] = round(bmr, 0)
    
    profile["health_goal"] = user.health_goal or "maintain"
    profile["activity_level"] = user.activity_level or "sedentary"
    
    return profile


class RecipeRecommendRequest(BaseModel):
    user_id: str = "default"
    foods: list[str] = []
    user_preferences: dict = {}
    max_time: int = 30
    filter_tags: list[str] = []
    feedback: str = ""


class RecipeItem(BaseModel):
    id: int
    name: str
    description: str = ""
    difficulty: str = "简单"
    cook_time: str = ""
    servings: str = ""
    main_ingredients: list[str] = []
    ingredients: list = []
    steps: list = []
    nutrition: dict = {}
    image_url: str = ""
    category: str = "家常菜"
    health_tags: list[str] = []
    health_score: int = 0


class RecipeListResponse(BaseModel):
    success: bool
    recipes: list[RecipeItem]
    total: int = 0


class RecipeRecommendResponse(BaseModel):
    success: bool
    recipes: list[RecipeItem]
    recommendations: str = ""
    error: str = ""


@router.get("/recipes", response_model=RecipeListResponse)
async def get_recipes(
    category: str = "",
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    """获取菜谱列表"""
    try:
        query = db.query(Recipe)
        
        if category:
            query = query.filter(Recipe.category == category)
        
        total = query.count()
        recipes = query.offset((page - 1) * page_size).limit(page_size).all()
        
        recipe_list = [_recipe_to_item(r) for r in recipes]
        
        return RecipeListResponse(
            success=True,
            recipes=recipe_list,
            total=total,
        )
    except Exception as e:
        logger.error(f"获取菜谱列表失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recipes/{recipe_id}", response_model=RecipeItem)
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """获取单个菜谱详情"""
    try:
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="菜谱不存在")
        
        return _recipe_to_item(recipe)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取菜谱详情失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recipes/recommend", response_model=RecipeRecommendResponse)
async def recommend_recipes(
    user_id: str = "default",
    foods: str = "",
    taste: str = "",
    avoid: str = "",
    max_time: int = 30,
    filter_tags: str = "",
    db: Session = Depends(get_db),
):
    """菜谱推荐接口（GET方式）"""
    logger.info(f"🍳 收到菜谱推荐请求(GET) - 用户ID: {user_id}")
    
    foods_list = [f.strip() for f in foods.split(",") if f.strip()] if foods else []
    prefs = {}
    if taste:
        prefs["taste"] = [t.strip() for t in taste.split(",")]
    if avoid:
        prefs["avoid"] = [a.strip() for a in avoid.split(",")]
    tags_list = [t.strip() for t in filter_tags.split(",") if t.strip()] if filter_tags else []
    
    return await _do_recommend(user_id, foods_list, prefs, max_time, tags_list, db)


@router.post("/recipes/recommend", response_model=RecipeRecommendResponse)
async def recommend_recipes_post(req: RecipeRecommendRequest, db: Session = Depends(get_db)):
    """菜谱推荐接口（POST方式）"""
    logger.info(f"🍳 收到菜谱推荐请求(POST) - 用户ID: {req.user_id}")
    
    return await _do_recommend(
        req.user_id, 
        req.foods, 
        req.user_preferences, 
        req.max_time, 
        req.filter_tags, 
        db
    )


async def _do_recommend(
    user_id: str, 
    foods: list, 
    user_preferences: dict, 
    max_time: int = 30,
    filter_tags: list = None,
    db: Session = None,
) -> RecipeRecommendResponse:
    """执行菜谱推荐的核心逻辑"""
    if filter_tags is None:
        filter_tags = []
    
    logger.info(f"🥗 食材: {len(foods)} 个 - {foods if foods else '无'}")
    logger.info(f"⏱️ 最大时间: {max_time}分钟，标签: {filter_tags}")
    if user_preferences:
        logger.info(f"👤 用户偏好: {user_preferences}")

    # 从数据库获取用户健康档案
    user_profile = {}
    if db and user_id and user_id != "default":
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user_profile = _build_user_profile(user)
                logger.info(f"📊 用户健康档案: {user_profile}")
        except Exception as e:
            logger.warning(f"⚠️ 获取用户信息失败: {e}")

    try:
        logger.info("🤖 调用 Recipe Agent 处理...")
        result = await recipe_agent.ainvoke(
            {
                "user_id": user_id,
                "foods": foods,
                "user_preferences": user_preferences,
                "user_profile": user_profile,
                "max_time": max_time,
                "filter_tags": filter_tags,
                "matched_recipes": [],
                "ai_recommendations": "",
                "final_recipes": [],
                "search_round": 0,
                "max_rounds": 3,
                "match_quality": "unknown",
            }
        )

        recipes = result.get("final_recipes", [])
        recommendations = result.get("ai_recommendations", "")
        
        logger.info(f"📋 推荐了 {len(recipes)} 个菜谱")
        if recipes:
            recipe_names = [r['name'] for r in recipes[:3]]
            logger.info(f"🍽️  菜谱列表: {', '.join(recipe_names)}{'...' if len(recipes) > 3 else ''}")
        
        logger.info(f"✅ 菜谱推荐请求处理成功")

        return RecipeRecommendResponse(
            success=True,
            recipes=recipes,
            recommendations=recommendations,
        )
    except Exception as e:
        logger.error(f"❌ 菜谱推荐请求处理失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
