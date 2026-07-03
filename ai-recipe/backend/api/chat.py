"""
AI对话 API
支持用户画像上下文和意图驱动的回复策略
"""

from __future__ import annotations

import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agents.chat_agent import chat_agent, SYSTEM_PROMPT
from services.qwen_service import qwen_service
from models.database import get_db
from models.tables import User, Favorite, CookHistory, Recipe

logger = logging.getLogger("AIRecipe.Chat")

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"
    user_preferences: dict = {}
    chat_history: list[dict] = []


class ChatResponse(BaseModel):
    success: bool
    reply: str
    intent: str = ""
    error: str = ""


# ========== 意图回复策略 ==========
INTENT_STRATEGIES = {
    "recommend": "用户想要推荐菜谱。请推荐2-3道具体菜谱，每道给出菜名、一句话亮点和推荐理由。如果知道用户收藏或常做的菜，请参考其偏好推荐。",
    "recipe": "用户想了解具体做法。请分步骤说明，包括食材用量、火候、关键技巧，步骤清晰易跟随。",
    "nutrition": "用户在咨询营养问题。请基于《中国居民膳食指南2022》回答，引用具体数据，语气专业但易懂。",
    "health": "用户关注健康饮食。请结合用户健康档案给出个性化建议，注意控制热量和营养均衡。",
    "skill": "用户想学习烹饪技巧。请给出实用技巧，步骤简洁，适合新手。",
    "chat": "",
}


def _build_user_context(user_id: str, db: Session) -> str:
    """从数据库查询用户画像，构建上下文字符串"""
    if not user_id or user_id == "default":
        return ""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return ""

    parts = []

    # 基本信息 + 健康数据
    profile = []
    if user.gender:
        profile.append(f"性别: {'男' if user.gender == 'male' else '女'}")
    if user.age:
        profile.append(f"年龄: {user.age}")
    if user.height and user.weight:
        height_m = float(user.height) / 100
        bmi = float(user.weight) / (height_m * height_m)
        bmi_status = "偏瘦" if bmi < 18.5 else "正常" if bmi < 24 else "超重" if bmi < 28 else "肥胖"
        profile.append(f"BMI: {bmi:.1f}({bmi_status})")
    if user.health_goal:
        goal_map = {"lose_weight": "减脂", "maintain": "维持体重", "gain_muscle": "增肌"}
        profile.append(f"健康目标: {goal_map.get(user.health_goal, '健康饮食')}")

    # 计算推荐热量
    if user.height and user.weight and user.age and user.gender:
        w, h, a = float(user.weight), float(user.height), user.age
        if user.gender == "male":
            bmr = 10 * w + 6.25 * h - 5 * a + 5
        else:
            bmr = 10 * w + 6.25 * h - 5 * a - 161
        activity_map = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
        tdee = bmr * activity_map.get(user.activity_level or "sedentary", 1.2)
        if user.health_goal == "lose_weight":
            target = tdee - 400
        elif user.health_goal == "gain_muscle":
            target = tdee + 400
        else:
            target = tdee
        profile.append(f"每日推荐热量: {int(target)}kcal")

    if profile:
        parts.append("用户档案：" + "，".join(profile))

    # 最近收藏
    favorites = (
        db.query(Recipe.name)
        .join(Favorite, Favorite.recipe_id == Recipe.id)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .limit(5)
        .all()
    )
    if favorites:
        names = [f.name for f in favorites]
        parts.append(f"最近收藏：{'、'.join(names)}")

    # 最近做过的菜
    history = (
        db.query(CookHistory.recipe_name)
        .filter(CookHistory.user_id == user_id)
        .order_by(CookHistory.created_at.desc())
        .limit(5)
        .all()
    )
    if history:
        names = [h.recipe_name for h in history if h.recipe_name]
        if names:
            parts.append(f"最近常做：{'、'.join(names)}")

    return "\n".join(parts) if parts else ""


@router.post("/chat/send", response_model=ChatResponse)
async def send_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """AI对话接口（非流式）"""
    logger.info(f"💬 收到对话请求 - 用户ID: {req.user_id}")

    try:
        result = await chat_agent.ainvoke(
            {
                "user_id": req.user_id,
                "user_message": req.message,
                "user_preferences": req.user_preferences,
                "intent": "",
                "tool_result": "",
                "reply": "",
                "chat_history": req.chat_history,
            }
        )

        return ChatResponse(
            success=True,
            reply=result.get("reply", ""),
            intent=result.get("intent", ""),
        )
    except Exception as e:
        logger.error(f"❌ 对话请求处理失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def send_chat_stream(req: ChatRequest, db: Session = Depends(get_db)):
    """AI对话流式接口（SSE）"""
    logger.info(f"💬 收到流式对话请求 - 用户ID: {req.user_id}")

    async def event_stream():
        try:
            # 1. 意图识别
            intent_prompt = f"""判断以下用户消息的意图，只返回一个分类：
- recommend: 想要推荐菜谱、今晚吃什么、食材搭配
- recipe: 询问具体菜谱做法、烹饪方法
- nutrition: 营养健康、膳食指南相关问题
- health: 健康饮食建议、体重管理、BMI相关
- skill: 烹饪技巧、做菜窍门
- chat: 日常闲聊、其他

用户消息：{req.message}

只返回分类名称，不要其他内容。"""

            intent_messages = [
                {"role": "system", "content": "你是一个意图分类器。只返回分类名称。"},
                {"role": "user", "content": intent_prompt},
            ]
            intent = (await qwen_service.chat(intent_messages, temperature=0.1, max_tokens=20)).strip().lower()
            valid_intents = ["recommend", "recipe", "nutrition", "health", "skill", "chat"]
            intent = intent if intent in valid_intents else "chat"

            yield f"data: {json.dumps({'type': 'intent', 'content': intent})}\n\n"

            # 2. 构建 system prompt
            system_content = SYSTEM_PROMPT

            # 意图策略
            strategy = INTENT_STRATEGIES.get(intent, "")
            if strategy:
                system_content += f"\n\n当前场景：{strategy}"

            # 用户偏好
            prefs = req.user_preferences
            if prefs.get("taste"):
                system_content += f"\n用户口味偏好：{'、'.join(prefs['taste'])}"
            if prefs.get("avoid"):
                system_content += f"\n用户忌口：{'、'.join(prefs['avoid'])}"

            # 用户画像（从数据库查询）
            user_context = _build_user_context(req.user_id, db)
            if user_context:
                system_content += f"\n\n{user_context}"

            # 3. 构建消息列表
            messages = [{"role": "system", "content": system_content}]
            for msg in req.chat_history[-10:]:
                messages.append(msg)
            messages.append({"role": "user", "content": req.message})

            # 4. 流式生成
            async for chunk in qwen_service.chat_stream(messages, temperature=0.7, max_tokens=800):
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"❌ 流式对话失败: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'content': '网络开小差了，请稍后再试～'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
