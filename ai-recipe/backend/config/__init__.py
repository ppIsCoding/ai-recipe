# 配置模块
"""
配置管理
从 .env 文件读取环境变量
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # 应用配置
    APP_NAME: str = "轻食智星后端"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # 数据库配置
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "ai_recipe")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            f"?charset=utf8mb4"
        )

    # 百度AI配置
    BAIDU_API_KEY: str = os.getenv("BAIDU_API_KEY", "")
    BAIDU_SECRET_KEY: str = os.getenv("BAIDU_SECRET_KEY", "")
    BAIDU_TOKEN_URL: str = "https://aip.baidubce.com/oauth/2.0/token"
    BAIDU_RECOGNIZE_URL: str = (
        "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general"
    )

    # 微信小程序配置
    WECHAT_APPID: str = os.getenv("WECHAT_APPID", "")
    WECHAT_SECRET: str = os.getenv("WECHAT_SECRET", "")

    # 通义千问配置
    QWEN_API_KEY: str = os.getenv("QWEN_API_KEY", "")
    QWEN_API_URL: str = (
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    )
    QWEN_MODEL: str = os.getenv("QWEN_MODEL", "qwen-plus")

    # 跨域配置
    CORS_ORIGINS: list = ["*"]


settings = Settings()
