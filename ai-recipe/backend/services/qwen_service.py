"""
通义千问服务封装
提供大模型对话能力
"""

from __future__ import annotations

import json
import logging
import re
import httpx
from config import settings

logger = logging.getLogger("AIRecipe.Service.Qwen")


class QwenService:
    """通义千问服务"""

    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 800,
    ) -> str:
        """
        通用对话接口
        messages: [{"role": "system/user/assistant", "content": "..."}]
        """
        logger.debug(f"📤 调用通义千问API (model: {settings.QWEN_MODEL}, temp: {temperature}, tokens: {max_tokens})")
        
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                settings.QWEN_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                },
                json={
                    "model": settings.QWEN_MODEL,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            data = resp.json()

        if "choices" in data and data["choices"]:
            content = data["choices"][0]["message"]["content"]
            logger.debug(f"📥 通义千问响应成功 (内容长度: {len(content)} 字符)")
            return content
        logger.error(f"❌ 通义千问调用失败: {data}")
        raise Exception(f"通义千问调用失败: {data}")

    async def chat_with_image(
        self,
        image_base64: str,
        prompt: str,
        model: str = "qwen3.5-omni-flash",
        temperature: float = 0.1,
        max_tokens: int = 1000,
    ) -> str:
        """
        多模态图片识别接口
        image_base64: 图片的base64编码
        prompt: 文字提示
        model: 模型名称（默认qwen3.5-omni-flash）
        """
        logger.debug(f"📤 调用通义千问多模态API (model: {model})")

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ]

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                settings.QWEN_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            data = resp.json()

        if "choices" in data and data["choices"]:
            content = data["choices"][0]["message"]["content"]
            logger.debug(f"📥 多模态响应成功 (内容长度: {len(content)} 字符)")
            return content
        logger.error(f"❌ 多模态调用失败: {data}")
        raise Exception(f"多模态调用失败: {data}")

    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 800,
    ):
        """
        流式对话接口（SSE）
        yields 每个文本片段
        """
        logger.debug(f"📤 调用通义千问流式API (model: {settings.QWEN_MODEL})")

        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                settings.QWEN_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                },
                json={
                    "model": settings.QWEN_MODEL,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

        logger.debug("📥 流式响应完成")

    async def chat_json(
        self,
        messages: list[dict],
        temperature: float = 0.1,
        max_tokens: int = 500,
    ) -> dict | list:
        """对话并解析JSON返回"""
        logger.debug("📤 调用通义千问API (JSON模式)")
        content = await self.chat(messages, temperature, max_tokens)
        
        # 提取JSON内容
        json_match = re.search(r"[\[\{][\s\S]*[\]\}]", content)
        if json_match:
            try:
                result = json.loads(json_match.group())
                logger.debug(f"✅ JSON解析成功 (类型: {type(result).__name__})")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON解析失败: {e}")
                logger.debug(f"原始内容: {content[:200]}")
        else:
            logger.warning("⚠️ 未找到JSON格式内容")
        
        return []


# 单例
qwen_service = QwenService()
