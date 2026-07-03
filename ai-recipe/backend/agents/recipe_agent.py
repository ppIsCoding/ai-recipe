"""
智能菜谱推荐 LangGraph Agent
基于《中国居民膳食指南2022》的健康菜谱推荐

特性:
- 条件路由 + 扩展搜索 + 状态管理
- 健康标签筛选（少盐/少油/高蛋白/轻烹饪）
- 基于用户BMI和健康目标的个性化推荐

流程图:
    输入 → filter_quick → match_recipes → should_expand?
                                              ↓           ↓
                                         ai_rank    expand_search
                                              ↑           ↓
                                              └───────────┘
                                              ↓
                                         format_final → END
"""

from __future__ import annotations

import logging
import random
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END

from services.qwen_service import qwen_service

logger = logging.getLogger("AIRecipe.Agent.Recipe")


# ========== 辅助函数 ==========
def parse_time_minutes(cook_time: str) -> int:
    """从 cook_time 字符串解析分钟数，如 '15分钟' -> 15"""
    if not cook_time:
        return 30  # 默认30分钟
    import re
    match = re.search(r'(\d+)', cook_time)
    return int(match.group(1)) if match else 30


# ========== 菜谱数据管理 ==========
_recipes_cache = []


def load_recipes_from_db():
    """从数据库加载菜谱数据"""
    global _recipes_cache
    try:
        from models.database import SessionLocal
        from models.tables import Recipe
        
        db = SessionLocal()
        try:
            recipes = db.query(Recipe).all()
            _recipes_cache = []
            for r in recipes:
                _recipes_cache.append({
                    "id": r.id,
                    "name": r.name,
                    "description": r.description or "",
                    "difficulty": r.difficulty or "简单",
                    "cook_time": r.cook_time or "",
                    "main_ingredients": r.main_ingredients or [],
                    "ingredients": r.ingredients or [],
                    "steps": r.steps or [],
                    "nutrition": r.nutrition or {},
                    "image_url": r.image_url or "",
                    "category": r.category or "家常菜",
                    "health_tags": r.health_tags or [],
                    "oil_per_serving": float(r.oil_per_serving or 0),
                    "salt_per_serving": float(r.salt_per_serving or 0),
                    "fiber_per_serving": float(r.fiber_per_serving or 0),
                })
            logger.info(f"✅ 从数据库加载了 {len(_recipes_cache)} 个菜谱")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"⚠️ 从数据库加载菜谱失败，使用默认数据: {e}")
        _recipes_cache = get_default_recipes()


def get_default_recipes():
    """获取默认菜谱数据（备用）- 基于膳食指南2022的健康菜谱"""
    return [
        {
            "id": 1, "name": "番茄炒蛋", "description": "经典家常菜，酸甜可口",
            "difficulty": "简单", "cook_time": "15分钟",
            "main_ingredients": ["番茄", "西红柿", "鸡蛋"],
            "ingredients": [{"name": "番茄", "amount": "2个"}, {"name": "鸡蛋", "amount": "3个"}],
            "steps": [{"step": 1, "desc": "番茄洗净切块，鸡蛋打散备用"}, 
                      {"step": 2, "desc": "热锅凉油，倒入蛋液滑散盛出"},
                      {"step": 3, "desc": "锅中放油，放入番茄翻炒出汁"},
                      {"step": 4, "desc": "加入鸡蛋翻炒均匀，调味即可"}],
            "nutrition": {"calories": 180, "protein": 12, "fat": 10, "carbs": 8},
            "category": "家常菜",
            "health_tags": ["少油", "高蛋白", "轻烹饪"],
            "oil_per_serving": 10, "salt_per_serving": 1.5, "fiber_per_serving": 2,
        },
        {
            "id": 2, "name": "清炒西兰花", "description": "低卡高纤维，健康首选",
            "difficulty": "简单", "cook_time": "10分钟",
            "main_ingredients": ["西兰花", "蒜"],
            "ingredients": [{"name": "西兰花", "amount": "300g"}, {"name": "蒜", "amount": "3瓣"}],
            "steps": [{"step": 1, "desc": "西兰花切小朵，焯水30秒"},
                      {"step": 2, "desc": "热锅少油，爆香蒜末"},
                      {"step": 3, "desc": "放入西兰花翻炒，加盐调味即可"}],
            "nutrition": {"calories": 80, "protein": 5, "fat": 3, "carbs": 10},
            "category": "素菜",
            "health_tags": ["少油", "少盐", "轻烹饪"],
            "oil_per_serving": 5, "salt_per_serving": 1.0, "fiber_per_serving": 6,
        },
        {
            "id": 3, "name": "鸡胸肉沙拉", "description": "高蛋白低脂，健身必备",
            "difficulty": "简单", "cook_time": "20分钟", "time_minutes": 20,
            "main_ingredients": ["鸡胸肉", "生菜", "黄瓜", "番茄"],
            "ingredients": [{"name": "鸡胸肉", "amount": "150g"}, {"name": "生菜", "amount": "100g"}, 
                           {"name": "黄瓜", "amount": "半根"}, {"name": "番茄", "amount": "1个"}],
            "steps": [{"step": 1, "desc": "鸡胸肉煮熟撕成丝"},
                      {"step": 2, "desc": "蔬菜洗净切好"},
                      {"step": 3, "desc": "混合所有食材，加少量沙拉酱"}],
            "nutrition": {"calories": 250, "protein": 30, "fat": 8, "carbs": 12},
            "category": "沙拉",
            "health_tags": ["高蛋白", "少油", "轻烹饪"],
            "oil_per_serving": 5, "salt_per_serving": 1.0, "fiber_per_serving": 4,
        },
        {
            "id": 4, "name": "蒜蓉虾仁", "description": "优质蛋白，少油健康",
            "difficulty": "简单", "cook_time": "15分钟", "time_minutes": 15,
            "main_ingredients": ["虾仁", "蒜"],
            "ingredients": [{"name": "虾仁", "amount": "200g"}, {"name": "蒜", "amount": "5瓣"}],
            "steps": [{"step": 1, "desc": "虾仁洗净，蒜切末"},
                      {"step": 2, "desc": "热锅少油，爆香蒜末"},
                      {"step": 3, "desc": "放入虾仁翻炒至变色，调味即可"}],
            "nutrition": {"calories": 150, "protein": 25, "fat": 5, "carbs": 3},
            "category": "海鲜",
            "health_tags": ["高蛋白", "少油", "少盐", "轻烹饪"],
            "oil_per_serving": 8, "salt_per_serving": 1.5, "fiber_per_serving": 1,
        },
        {
            "id": 5, "name": "蒸蛋羹", "description": "嫩滑可口，老少皆宜",
            "difficulty": "简单", "cook_time": "15分钟", "time_minutes": 15,
            "main_ingredients": ["鸡蛋"],
            "ingredients": [{"name": "鸡蛋", "amount": "2个"}, {"name": "温水", "amount": "200ml"}],
            "steps": [{"step": 1, "desc": "鸡蛋打散，加入温水搅匀"},
                      {"step": 2, "desc": "过滤蛋液，去除气泡"},
                      {"step": 3, "desc": "上锅蒸10分钟，淋少许酱油即可"}],
            "nutrition": {"calories": 120, "protein": 10, "fat": 8, "carbs": 2},
            "category": "家常菜",
            "health_tags": ["少油", "少盐", "高蛋白", "轻烹饪"],
            "oil_per_serving": 0, "salt_per_serving": 1.0, "fiber_per_serving": 0,
        },
        {
            "id": 6, "name": "凉拌黄瓜", "description": "清爽开胃，零油烟",
            "difficulty": "简单", "cook_time": "10分钟", "time_minutes": 10,
            "main_ingredients": ["黄瓜", "蒜"],
            "ingredients": [{"name": "黄瓜", "amount": "2根"}, {"name": "蒜", "amount": "3瓣"}],
            "steps": [{"step": 1, "desc": "黄瓜拍碎切段"},
                      {"step": 2, "desc": "蒜切末，加入调料"},
                      {"step": 3, "desc": "拌匀即可食用"}],
            "nutrition": {"calories": 50, "protein": 2, "fat": 2, "carbs": 6},
            "category": "凉菜",
            "health_tags": ["少油", "少盐", "轻烹饪"],
            "oil_per_serving": 3, "salt_per_serving": 1.0, "fiber_per_serving": 2,
        },
        {
            "id": 7, "name": "番茄牛腩", "description": "营养丰富，暖胃佳品",
            "difficulty": "中等", "cook_time": "45分钟", "time_minutes": 45,
            "main_ingredients": ["牛腩", "番茄"],
            "ingredients": [{"name": "牛腩", "amount": "300g"}, {"name": "番茄", "amount": "2个"}],
            "steps": [{"step": 1, "desc": "牛腩切块焯水"},
                      {"step": 2, "desc": "番茄切块"},
                      {"step": 3, "desc": "锅中加水，放入牛腩和番茄炖煮40分钟"},
                      {"step": 4, "desc": "调味即可"}],
            "nutrition": {"calories": 350, "protein": 28, "fat": 18, "carbs": 15},
            "category": "炖菜",
            "health_tags": ["高蛋白"],
            "oil_per_serving": 10, "salt_per_serving": 2.0, "fiber_per_serving": 3,
        },
        {
            "id": 8, "name": "清蒸鲈鱼", "description": "原汁原味，营养健康",
            "difficulty": "简单", "cook_time": "20分钟", "time_minutes": 20,
            "main_ingredients": ["鲈鱼", "葱", "姜"],
            "ingredients": [{"name": "鲈鱼", "amount": "1条"}, {"name": "葱", "amount": "2根"}, 
                           {"name": "姜", "amount": "3片"}],
            "steps": [{"step": 1, "desc": "鲈鱼处理干净，划几刀"},
                      {"step": 2, "desc": "放上葱姜，上锅蒸8分钟"},
                      {"step": 3, "desc": "淋上蒸鱼豉油，泼热油即可"}],
            "nutrition": {"calories": 180, "protein": 25, "fat": 8, "carbs": 2},
            "category": "海鲜",
            "health_tags": ["高蛋白", "少油", "轻烹饪"],
            "oil_per_serving": 10, "salt_per_serving": 1.5, "fiber_per_serving": 1,
        },
    ]


def get_recipe_database():
    """获取菜谱数据库"""
    global _recipes_cache
    if not _recipes_cache:
        load_recipes_from_db()
    return _recipes_cache


# ========== 健康评分计算 ==========
def calculate_health_score(recipe: dict, user_profile: dict = None) -> int:
    """
    计算菜谱健康评分（基于《中国居民膳食指南2022》）
    
    Args:
        recipe: 菜谱数据
        user_profile: 用户健康档案 {bmi, health_goal, activity_level}
    
    Returns:
        健康评分 (0-100)
    """
    score = 50  # 基础分
    
    health_tags = recipe.get("health_tags", [])
    
    # 基于膳食指南的加分
    if "少盐" in health_tags:
        score += 10  # 准则5：少盐少油
    if "少油" in health_tags:
        score += 10  # 准则5：少盐少油
    if "高蛋白" in health_tags:
        score += 5   # 准则4：适量吃鱼禽蛋瘦肉
    if "轻烹饪" in health_tags:
        score += 5   # 职场场景：快速烹饪
    
    # 荤素搭配检查
    ingredients = recipe.get("main_ingredients", [])
    has_vegetable = any(v in str(ingredients) for v in ["蔬菜", "西兰花", "黄瓜", "番茄", "生菜", "菠菜", "白菜"])
    has_protein = any(p in str(ingredients) for p in ["鸡", "猪", "牛", "鱼", "虾", "蛋", "豆腐"])
    if has_vegetable and has_protein:
        score += 10  # 准则1：食物多样，合理搭配
    
    # 根据用户健康目标调整
    if user_profile:
        bmi = user_profile.get("bmi")
        health_goal = user_profile.get("health_goal", "maintain")
        
        # 减脂用户：优先低卡少油
        if health_goal == "lose_weight":
            if "少油" in health_tags:
                score += 5
            calories = recipe.get("nutrition", {}).get("calories", 0)
            if calories <= 300:
                score += 5
        
        # 增肌用户：优先高蛋白
        elif health_goal == "gain_muscle":
            if "高蛋白" in health_tags:
                score += 10
        
        # 超重用户：减少高热量菜谱
        if bmi and bmi >= 24:
            calories = recipe.get("nutrition", {}).get("calories", 0)
            if calories > 400:
                score -= 10
    
    return max(0, min(100, score))


# ========== State 定义 ==========
class RecipeState(TypedDict):
    user_id: str
    foods: Annotated[list, "用户输入的食材"]
    user_preferences: Annotated[dict, "用户偏好"]
    user_profile: Annotated[dict, "用户健康档案"]
    max_time: Annotated[int, "最大烹饪时间(分钟)"]
    filter_tags: Annotated[list, "筛选的健康标签"]
    matched_recipes: Annotated[list, "匹配到的菜谱"]
    ai_recommendations: Annotated[str, "AI推荐说明"]
    final_recipes: Annotated[list, "最终推荐菜谱"]
    search_round: Annotated[int, "搜索轮次"]
    max_rounds: Annotated[int, "最大搜索轮次"]
    match_quality: Annotated[str, "匹配质量: good/medium/poor"]


# ========== 节点函数 ==========
async def filter_quick_recipes(state: RecipeState) -> dict:
    """筛选轻烹饪菜谱（≤30分钟）"""
    recipe_db = get_recipe_database()
    max_time = state.get("max_time", 30)
    filter_tags = state.get("filter_tags", [])
    
    logger.info(f"⏱️ 筛选轻烹饪菜谱，最大时间: {max_time}分钟，标签: {filter_tags}")
    
    filtered = []
    for recipe in recipe_db:
        # 时间筛选（从 cook_time 解析分钟数）
        time_minutes = parse_time_minutes(recipe.get("cook_time", ""))
        if time_minutes <= max_time:
            # 标签筛选
            if filter_tags:
                recipe_tags = recipe.get("health_tags", [])
                if any(tag in recipe_tags for tag in filter_tags):
                    filtered.append(recipe)
            else:
                filtered.append(recipe)
    
    # 如果筛选结果太少，放宽条件
    if len(filtered) < 3:
        filtered = [r for r in recipe_db if parse_time_minutes(r.get("cook_time", "")) <= max_time]
    
    # 如果还是太少，返回所有菜谱
    if len(filtered) < 3:
        filtered = recipe_db
    
    logger.info(f"✅ 筛选后剩余 {len(filtered)} 个菜谱")
    
    return {
        "matched_recipes": filtered,
        "search_round": 0,
        "max_rounds": 3,
        "match_quality": "good",
    }


async def match_recipes(state: RecipeState) -> dict:
    """根据食材匹配菜谱"""
    foods = state.get("foods", [])
    filtered_recipes = state.get("matched_recipes", [])
    search_round = state.get("search_round", 0)
    
    logger.info(f"🔍 第 {search_round} 轮匹配，食材: {foods}")
    
    if not foods:
        logger.info("📋 无食材输入，返回筛选后的菜谱")
        return {
            "matched_recipes": filtered_recipes[:6],
            "match_quality": "good",
            "search_round": search_round + 1,
        }

    scored = []
    for recipe in filtered_recipes:
        score = 0
        matched = []
        for food_name in foods:
            for ingredient in recipe["main_ingredients"]:
                if food_name in ingredient or ingredient in food_name:
                    score += 1
                    matched.append(ingredient)
                    break
        if score > 0:
            scored.append({"recipe": recipe, "score": score, "matched": matched})

    scored.sort(key=lambda x: x["score"], reverse=True)
    matched_recipes = [item["recipe"] for item in scored[:6]]
    match_scores = {item["recipe"]["id"]: item["score"] for item in scored[:6]}

    # 判断匹配质量
    if len(matched_recipes) >= 3:
        match_quality = "good"
    elif len(matched_recipes) >= 1:
        match_quality = "medium"
    else:
        match_quality = "poor"
    
    if not matched_recipes:
        logger.warning("⚠️ 未找到匹配的菜谱，返回随机推荐")
        matched_recipes = filtered_recipes[:3]
        match_scores = {}
    else:
        logger.info(f"✅ 匹配到 {len(matched_recipes)} 个菜谱，质量: {match_quality}")

    return {
        "matched_recipes": matched_recipes,
        "match_quality": match_quality,
        "match_scores": match_scores,
    }


async def _get_similar_foods(foods: list) -> list:
    """调用AI获取相似食材"""
    prompt = f"""请为以下食材各列出2-3个常用的相似/替代食材，只返回食材名称。

食材：{', '.join(foods)}

要求：
1. 只返回可以互相替代的食材
2. 用常见名称，不要学名
3. 返回JSON数组格式

示例输入：["番茄", "鸡蛋"]
示例输出：["西红柿", "蛋", "鸭蛋"]"""

    try:
        messages = [
            {"role": "system", "content": "你是食材专家，只返回JSON数组格式的相似食材列表。"},
            {"role": "user", "content": prompt}
        ]
        result = await qwen_service.chat_json(messages, temperature=0.3, max_tokens=200)
        if isinstance(result, list):
            return [str(f) for f in result if isinstance(f, str)]
    except Exception as e:
        logger.warning(f"⚠️ AI获取相似食材失败: {e}")

    return []


async def expand_search(state: RecipeState) -> dict:
    """扩展搜索：AI生成相似食材 + 同分类兜底"""
    foods = state.get("foods", [])
    current_recipes = state.get("matched_recipes", [])
    all_recipes = get_recipe_database()

    logger.info(f"🔍 扩展搜索，当前匹配 {len(current_recipes)} 个菜谱")

    expanded = list(current_recipes)
    current_ids = {r["id"] for r in current_recipes}

    # 策略1: AI生成相似食材并扩展
    if foods:
        similar_foods = await _get_similar_foods(foods)
        logger.info(f"🔗 AI生成相似食材: {similar_foods}")
        if similar_foods:
            for recipe in all_recipes:
                if recipe["id"] in current_ids:
                    continue
                for food in similar_foods:
                    for ingredient in recipe.get("main_ingredients", []):
                        if food in ingredient or ingredient in food:
                            expanded.append(recipe)
                            current_ids.add(recipe["id"])
                            break

    # 策略2: 同分类兜底（仍不足3个）
    if len(expanded) < 3:
        categories = {r.get("category", "") for r in current_recipes}
        for recipe in all_recipes:
            if recipe["id"] not in current_ids and recipe.get("category", "") in categories:
                expanded.append(recipe)
                current_ids.add(recipe["id"])
                if len(expanded) >= 6:
                    break

    # 策略3: 默认快手菜谱兜底
    if len(expanded) < 3:
        quick_recipes = [r for r in all_recipes
                        if r["id"] not in current_ids
                        and parse_time_minutes(r.get("cook_time", "")) <= 15]
        quick_recipes.sort(key=lambda x: calculate_health_score(x), reverse=True)
        expanded.extend(quick_recipes[:3 - len(expanded)])

    logger.info(f"✅ 扩展搜索完成，共 {len(expanded)} 个菜谱")

    return {
        "matched_recipes": expanded[:6],
        "search_round": state.get("search_round", 0) + 1,
    }


async def ai_rank_recipes(state: RecipeState) -> dict:
    """AI排序并生成推荐说明"""
    recipes = state["matched_recipes"]
    prefs = state.get("user_preferences", {})
    user_profile = state.get("user_profile", {})
    
    logger.info(f"🤖 AI排序 {len(recipes)} 个菜谱...")

    # 计算健康评分
    scored_recipes = []
    for recipe in recipes:
        health_score = calculate_health_score(recipe, user_profile)
        scored_recipes.append({"recipe": recipe, "health_score": health_score})
    
    # 按健康评分排序
    scored_recipes.sort(key=lambda x: x["health_score"], reverse=True)
    recipes = [item["recipe"] for item in scored_recipes]
    health_scores = {item["recipe"]["id"]: item["health_score"] for item in scored_recipes}

    recipe_names = "、".join([r["name"] for r in recipes[:6]])
    context = f"可选菜谱：{recipe_names}"

    if prefs.get("taste"):
        context += f"\n用户口味：{'、'.join(prefs['taste'])}"
    if prefs.get("avoid"):
        context += f"\n用户忌口：{'、'.join(prefs['avoid'])}"
    
    # 添加健康目标信息
    if user_profile.get("health_goal"):
        goal_map = {
            "lose_weight": "减脂",
            "maintain": "维持体重",
            "gain_muscle": "增肌"
        }
        context += f"\n健康目标：{goal_map.get(user_profile['health_goal'], '健康饮食')}"

    prompt = f"""基于《中国居民膳食指南2022》，为职场人士推荐今晚的健康菜谱。

{context}

要求：
1. 优先推荐轻烹饪（30分钟内）的菜谱
2. 考虑营养均衡（荤素搭配）
3. 用一两句话推荐最适合的菜谱，并说明为什么健康

直接给出推荐理由，不要列出菜谱清单。"""

    messages = [
        {"role": "system", "content": "你是基于《中国居民膳食指南2022》的健康饮食顾问，专门为职场人士推荐简单健康的菜谱。"},
        {"role": "user", "content": prompt},
    ]

    try:
        recommendations = await qwen_service.chat(messages, temperature=0.7, max_tokens=200)
        logger.info(f"✅ AI推荐说明生成成功")
    except Exception as e:
        logger.warning(f"⚠️ AI推荐说明生成失败，使用默认文案: {e}")
        recommendations = "为您推荐以下轻烹饪健康菜谱，符合《中国居民膳食指南2022》建议，简单易做又营养。"

    return {
        "ai_recommendations": recommendations,
        "match_scores": health_scores,
    }


async def format_final(state: RecipeState) -> dict:
    """格式化最终结果"""
    recipes = state["matched_recipes"]
    recommendations = state.get("ai_recommendations", "")
    match_scores = state.get("match_scores", {})
    user_profile = state.get("user_profile", {})
    
    results = []
    for r in recipes:
        recipe_id = r["id"]
        health_score = match_scores.get(recipe_id, calculate_health_score(r, user_profile))
        
        results.append({
            "id": r["id"],
            "name": r["name"],
            "desc": r.get("description", "") or f"{r.get('difficulty', '简单')} · {r.get('cook_time', '')}",
            "difficulty": r["difficulty"],
            "cook_time": r["cook_time"],
            "main_ingredients": r["main_ingredients"],
            "nutrition": r["nutrition"],
            "image_url": r.get("image_url", ""),
            "category": r.get("category", "家常菜"),
            "health_tags": r.get("health_tags", []),
            "health_score": health_score,
        })
    
    # 按健康评分排序
    results.sort(key=lambda x: x["health_score"], reverse=True)
    
    logger.info(f"📦 格式化完成，最终返回 {len(results)} 个菜谱")
    return {"final_recipes": results}


# ========== 条件路由函数 ==========
def should_expand_search(state: RecipeState) -> Literal["ai_rank", "expand_search"]:
    """根据匹配结果决定下一步"""
    match_quality = state.get("match_quality", "unknown")
    search_round = state.get("search_round", 0)

    # 匹配质量好或已扩展过一次，进入AI排序
    if match_quality == "good" or search_round >= 1:
        logger.info(f"🔀 路由: 进入AI排序 (quality: {match_quality}, round: {search_round})")
        return "ai_rank"

    # 否则进入扩展搜索
    logger.info(f"🔀 路由: 进入扩展搜索 (quality: {match_quality})")
    return "expand_search"


# ========== 构建 Graph ==========
def build_recipe_graph():
    """构建菜谱推荐Agent - 条件路由 + 扩展搜索"""
    workflow = StateGraph(RecipeState)

    # 添加节点
    workflow.add_node("filter_quick", filter_quick_recipes)
    workflow.add_node("match_recipes", match_recipes)
    workflow.add_node("expand_search", expand_search)
    workflow.add_node("ai_rank", ai_rank_recipes)
    workflow.add_node("format_final", format_final)

    # 设置入口
    workflow.set_entry_point("filter_quick")

    # 流程：筛选 -> 匹配 -> 条件路由
    workflow.add_edge("filter_quick", "match_recipes")
    workflow.add_conditional_edges(
        "match_recipes",
        should_expand_search,
        {
            "ai_rank": "ai_rank",
            "expand_search": "expand_search"
        }
    )

    # 扩展搜索后直接进入AI排序
    workflow.add_edge("expand_search", "ai_rank")
    workflow.add_edge("ai_rank", "format_final")
    workflow.add_edge("format_final", END)

    return workflow.compile()


# 单例
recipe_agent = build_recipe_graph()
