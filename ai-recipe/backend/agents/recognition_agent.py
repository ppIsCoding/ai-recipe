"""
食材识别 LangGraph Agent
流水线: 图片 → 通义千问多模态识别 → 格式化 → 返回结构化食材列表
"""

from __future__ import annotations

import logging
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END

from services.qwen_service import qwen_service

logger = logging.getLogger("AIRecipe.Agent.Recognition")


# ========== State 定义 ==========
class RecognitionState(TypedDict):
    image_base64: str
    analyzed_foods: Annotated[list, "识别分析后的食材"]
    final_foods: Annotated[list, "最终返回的食材列表"]
    error: str


# ========== 节点函数 ==========
async def qwen_recognize(state: RecognitionState) -> dict:
    """调用通义千问多模态模型识别图片中的食材"""
    logger.info("📸 调用通义千问多模态识别...")

    prompt = """你是一个专业的食材识别助手。请仔细识别这张图片中的所有**原材料/生鲜食材**，返回JSON数组格式。

要求：
- 只识别原材料和生鲜食材（如：鸡蛋、虾、猪肉、西红柿、土豆、牛奶等）
- 不要识别已经烹饪好的菜品（如：番茄炒蛋、红烧肉等成品菜）
- 如果图片中是成品菜，请识别出它用到的原材料
- 使用常见的中文食材名称

每个元素包含：
1. name: 食材名称（如：鸡蛋、虾、猪肉、西红柿）
2. category: 分类（蔬菜/水果/肉类/海鲜/蛋奶/主食/调料/其他）
3. shelf_life_days: 该食材在冰箱中的建议保存天数
4. probability: 你对识别结果的置信度（0-1之间的小数）

如果图片中没有食材或无法识别，返回空数组 []

请直接返回JSON数组，不要其他内容。示例：
[{"name":"鸡蛋","category":"蛋奶","shelf_life_days":21,"probability":0.95},{"name":"西红柿","category":"蔬菜","shelf_life_days":5,"probability":0.9}]"""

    try:
        content = await qwen_service.chat_with_image(
            image_base64=state["image_base64"],
            prompt=prompt,
            model="qwen3.5-omni-flash",
            temperature=0.1,
            max_tokens=1000,
        )

        import json
        import re

        json_match = re.search(r"[\[\{][\s\S]*[\]\}]", content)
        if json_match:
            result = json.loads(json_match.group())
            if isinstance(result, list):
                logger.info(f"✅ 多模态识别成功，识别到 {len(result)} 个食材")
                return {"analyzed_foods": result, "error": ""}
        
        logger.warning("⚠️ 多模态返回内容无法解析为JSON数组")
        return {"analyzed_foods": [], "error": "识别结果解析失败"}
    except Exception as e:
        logger.error(f"❌ 多模态识别失败: {e}")
        return {"analyzed_foods": [], "error": f"识别失败: {str(e)}"}


async def format_results(state: RecognitionState) -> dict:
    """格式化最终结果"""
    if state.get("error"):
        logger.warning(f"⚠️ 格式化结果时发现错误: {state['error']}")

    foods = []
    for item in state.get("analyzed_foods", []):
        if isinstance(item, dict) and "name" in item:
            foods.append(
                {
                    "name": item["name"],
                    "category": item.get("category", "其他"),
                    "shelf_life_days": item.get("shelf_life_days", 3),
                    "probability": item.get("probability", 0.9),
                }
            )

    logger.info(f"📦 格式化完成，最终返回 {len(foods)} 个食材")
    return {"final_foods": foods}


# ========== 构建 Graph ==========
def build_recognition_graph():
    """构建食材识别Agent"""
    workflow = StateGraph(RecognitionState)

    workflow.add_node("qwen_recognize", qwen_recognize)
    workflow.add_node("format_results", format_results)

    workflow.set_entry_point("qwen_recognize")
    workflow.add_edge("qwen_recognize", "format_results")
    workflow.add_edge("format_results", END)

    return workflow.compile()


# 单例
recognition_agent = build_recognition_graph()
