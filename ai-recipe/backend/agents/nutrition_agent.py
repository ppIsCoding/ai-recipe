"""
营养分析 LangGraph Agent
流水线: 查询食材营养 → 计算总量 → 生成建议 → 返回结果
"""

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END

from services.qwen_service import qwen_service


# ========== State 定义 ==========
class NutritionState(TypedDict):
    foods: Annotated[list, "输入的食材列表"]
    nutrition_data: Annotated[list, "每种食材的营养成分"]
    total_nutrition: Annotated[dict, "总营养汇总"]
    health_advice: Annotated[str, "健康建议"]
    recommended_recipes: Annotated[list, "推荐做法"]


# ========== 节点函数 ==========
async def analyze_nutrition(state: NutritionState) -> dict:
    """分析每种食材的营养成分"""
    foods = state["foods"]
    food_str = "、".join(foods)

    prompt = f"""请分析以下食材的营养成分，返回JSON数组格式。
每个元素包含：
- name: 食材名称
- calories: 热量(kcal，每100g)
- protein: 蛋白质(g)
- fat: 脂肪(g)
- carbs: 碳水化合物(g)
- fiber: 膳食纤维(g)
- vitamins: 主要维生素(字符串)

食材：{food_str}

请直接返回JSON数组，不要其他内容。示例：
[{{"name":"番茄","calories":18,"protein":0.9,"fat":0.2,"carbs":3.9,"fiber":1.2,"vitamins":"维生素C、维生素A"}}]"""

    messages = [
        {"role": "system", "content": "你是一个营养分析专家，负责分析食材的营养成分。只返回JSON格式数据。"},
        {"role": "user", "content": prompt},
    ]

    try:
        result = await qwen_service.chat_json(messages, temperature=0.1, max_tokens=800)
        nutrition_data = result if isinstance(result, list) else []
    except Exception as e:
        nutrition_data = []

    return {"nutrition_data": nutrition_data}


async def calculate_total(state: NutritionState) -> dict:
    """计算总营养"""
    nutrition_data = state["nutrition_data"]

    total = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0, "fiber": 0}
    for item in nutrition_data:
        if isinstance(item, dict):
            total["calories"] += item.get("calories", 0)
            total["protein"] += item.get("protein", 0)
            total["fat"] += item.get("fat", 0)
            total["carbs"] += item.get("carbs", 0)
            total["fiber"] += item.get("fiber", 0)

    # 四舍五入
    for key in total:
        total[key] = round(total[key], 1)

    return {"total_nutrition": total}


async def generate_advice(state: NutritionState) -> dict:
    """生成健康建议"""
    total = state["total_nutrition"]
    foods = state["foods"]
    food_str = "、".join(foods)

    prompt = f"""根据以下食材和营养数据，给出健康饮食建议（200字以内）。

食材：{food_str}
总热量：{total['calories']}kcal
蛋白质：{total['protein']}g
脂肪：{total['fat']}g
碳水：{total['carbs']}g

请给出：
1. 这顿饭的营养评价
2. 适合什么人群
3. 搭配建议"""

    messages = [
        {"role": "system", "content": "你是一个专业的营养师，负责给出健康饮食建议。回复简洁明了。"},
        {"role": "user", "content": prompt},
    ]

    try:
        advice = await qwen_service.chat(messages, temperature=0.7, max_tokens=300)
    except Exception:
        advice = "这是一道营养均衡的菜品，建议搭配主食一起食用。"

    return {"health_advice": advice}


async def suggest_recipes(state: NutritionState) -> dict:
    """推荐做法"""
    foods = state["foods"]
    food_str = "、".join(foods)

    prompt = f"""根据以下食材，推荐2-3种简单的做法名称，返回JSON数组。
食材：{food_str}

只返回做法名称数组，示例：["番茄炒蛋","番茄蛋汤","番茄沙拉"]"""

    messages = [
        {"role": "system", "content": "你是一个厨师，负责推荐做法。只返回JSON数组。"},
        {"role": "user", "content": prompt},
    ]

    try:
        result = await qwen_service.chat_json(messages, temperature=0.7, max_tokens=200)
        recipes = result if isinstance(result, list) else []
    except Exception:
        recipes = []

    return {"recommended_recipes": recipes}


# ========== 构建 Graph ==========
def build_nutrition_graph():
    """构建营养分析Agent"""
    workflow = StateGraph(NutritionState)

    workflow.add_node("analyze_nutrition", analyze_nutrition)
    workflow.add_node("calculate_total", calculate_total)
    workflow.add_node("generate_advice", generate_advice)
    workflow.add_node("suggest_recipes", suggest_recipes)

    workflow.set_entry_point("analyze_nutrition")
    workflow.add_edge("analyze_nutrition", "calculate_total")
    workflow.add_edge("calculate_total", "generate_advice")
    workflow.add_edge("generate_advice", "suggest_recipes")
    workflow.add_edge("suggest_recipes", END)

    return workflow.compile()


# 单例
nutrition_agent = build_nutrition_graph()
