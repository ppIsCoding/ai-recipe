"""
AI对话增强 LangGraph Agent
基于《中国居民膳食指南2022》的健康饮食顾问

功能: 意图识别 → 生成回复
聚焦场景: 今晚吃什么 + 健康饮食建议
"""

from __future__ import annotations

import logging
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END

from services.qwen_service import qwen_service

logger = logging.getLogger("AIRecipe.Agent.Chat")


# ========== State 定义 ==========
class ChatState(TypedDict):
    user_id: str
    user_message: str
    user_preferences: Annotated[dict, "用户偏好"]
    user_profile: Annotated[dict, "用户健康档案"]
    intent: Annotated[str, "识别到的意图"]
    reply: Annotated[str, "最终回复"]
    chat_history: Annotated[list, "对话历史"]


# ========== 系统提示词 ==========
SYSTEM_PROMPT = """你是"小厨"，基于《中国居民膳食指南2022》的健康饮食顾问。你专门为职场人士提供健康饮食建议。

你的核心能力：
1. 今晚吃什么：根据用户情况推荐简单健康的菜谱
2. 健康饮食：基于膳食指南提供营养建议
3. 烹饪技巧：分享简单易学的烹饪方法
4. 营养咨询：解答健康饮食相关问题

《中国居民膳食指南2022》八大准则：
1. 食物多样，合理搭配
2. 吃动平衡，健康体重
3. 多吃蔬果、奶类、全谷、大豆
4. 适量吃鱼、禽、蛋、瘦肉
5. 少盐少油，控糖限酒
6. 规律进餐，足量饮水
7. 会烹会选，会看标签
8. 公筷分餐，杜绝浪费

每日推荐摄入量：
- 谷薯类：200-300g
- 蔬菜：300-500g
- 水果：200-350g
- 肉禽鱼蛋：120-200g
- 奶制品：300-500g
- 盐：<5g，油：25-30g

回复要求：
- 简洁明了，分点说明
- 推荐菜谱时优先考虑轻烹饪（30分钟内）
- 强调健康价值（少盐少油、荤素搭配）
- 语气友好亲切，像一个专业的营养师朋友
- 回复控制在300字以内"""


# ========== 节点函数 ==========
async def detect_intent(state: ChatState) -> dict:
    """识别用户意图"""
    message = state["user_message"]
    logger.debug(f"🔍 开始意图识别: {message[:30]}...")

    prompt = f"""判断以下用户消息的意图，只返回一个分类：
- recommend: 想要推荐菜谱、今晚吃什么、食材搭配
- recipe: 询问具体菜谱做法、烹饪方法
- nutrition: 营养健康、膳食指南相关问题
- health: 健康饮食建议、体重管理、BMI相关
- skill: 烹饪技巧、做菜窍门
- chat: 日常闲聊、其他

用户消息：{message}

只返回分类名称，不要其他内容。"""

    messages = [
        {"role": "system", "content": "你是一个意图分类器。只返回分类名称。"},
        {"role": "user", "content": prompt},
    ]

    try:
        intent = (await qwen_service.chat(messages, temperature=0.1, max_tokens=20)).strip().lower()
        valid_intents = ["recommend", "recipe", "nutrition", "health", "skill", "chat"]
        intent = intent if intent in valid_intents else "chat"
        logger.debug(f"✅ 意图识别结果: {intent}")
    except Exception as e:
        logger.warning(f"⚠️ 意图识别失败，使用默认值: {e}")
        intent = "chat"

    return {"intent": intent}


async def generate_reply(state: ChatState) -> dict:
    """生成最终回复"""
    logger.debug("💬 开始生成AI回复...")
    system_content = SYSTEM_PROMPT

    # 添加用户健康档案上下文
    user_profile = state.get("user_profile", {})
    if user_profile:
        profile_info = []
        if user_profile.get("bmi"):
            bmi = user_profile["bmi"]
            bmi_status = "偏瘦" if bmi < 18.5 else "正常" if bmi < 24 else "超重" if bmi < 28 else "肥胖"
            profile_info.append(f"BMI: {bmi:.1f} ({bmi_status})")
        if user_profile.get("health_goal"):
            goal_map = {
                "lose_weight": "减脂",
                "maintain": "维持体重",
                "gain_muscle": "增肌"
            }
            profile_info.append(f"健康目标: {goal_map.get(user_profile['health_goal'], '健康饮食')}")
        if user_profile.get("tdee"):
            profile_info.append(f"每日推荐热量: {user_profile['tdee']}kcal")
        
        if profile_info:
            system_content += f"\n\n用户健康档案：{' | '.join(profile_info)}"
            system_content += "\n请根据用户的健康状况提供个性化建议。"

    # 添加用户偏好上下文
    prefs = state.get("user_preferences", {})
    if prefs.get("taste"):
        system_content += f"\n用户口味偏好：{'、'.join(prefs['taste'])}"
    if prefs.get("avoid"):
        system_content += f"\n用户忌口：{'、'.join(prefs['avoid'])}"

    # 构建消息列表
    messages = [{"role": "system", "content": system_content}]

    # 添加历史对话
    for msg in state.get("chat_history", [])[-10:]:
        messages.append(msg)

    # 添加当前用户消息
    messages.append({"role": "user", "content": state["user_message"]})

    try:
        logger.debug(f"📤 调用通义千问API (messages: {len(messages)}, temp: 0.7)")
        reply = await qwen_service.chat(messages, temperature=0.7, max_tokens=800)
        logger.debug(f"📥 AI回复生成成功 (长度: {len(reply)} 字符)")
    except Exception as e:
        logger.error(f"❌ AI回复生成失败: {e}")
        reply = "网络开小差了，请稍后再试～"

    return {"reply": reply}


# ========== 构建 Graph ==========
def build_chat_graph():
    """构建AI对话Agent"""
    workflow = StateGraph(ChatState)

    workflow.add_node("detect_intent", detect_intent)
    workflow.add_node("generate_reply", generate_reply)

    workflow.set_entry_point("detect_intent")
    workflow.add_edge("detect_intent", "generate_reply")
    workflow.add_edge("generate_reply", END)

    return workflow.compile()


# 单例
chat_agent = build_chat_graph()
