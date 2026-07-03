"""
轻食智星 - FastAPI 后端入口
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from config import settings
from api.recognize import router as recognize_router
from api.chat import router as chat_router
from api.recipe import router as recipe_router
from api.favorites import router as favorites_router
from api.history import router as history_router
from api.nutrition import router as nutrition_router
from api.users import router as users_router
from models.database import init_db

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("AIRecipe")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("="*60)
    logger.info("🚀 轻食智星后端服务启动中...")
    logger.info(f"📌 应用名称: {settings.APP_NAME}")
    logger.info(f"📌 版本: {settings.APP_VERSION}")
    logger.info(f"📌 调试模式: {settings.DEBUG}")
    logger.info(f"📌 数据库: {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}")
    
    try:
        init_db()
        logger.info("✅ 数据库初始化成功")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        raise
    
    # 从数据库加载菜谱数据
    try:
        from agents.recipe_agent import load_recipes_from_db
        load_recipes_from_db()
    except Exception as e:
        logger.warning(f"⚠️ 加载菜谱数据失败: {e}")
    
    logger.info("="*60)
    logger.info(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} 启动成功")
    logger.info("="*60)
    yield
    # 关闭时执行
    logger.info("="*60)
    logger.info(f"👋 {settings.APP_NAME} 正在关闭...")
    logger.info("="*60)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="基于《中国居民膳食指南2022》的职场健康轻烹饪菜谱推荐服务",
    lifespan=lifespan,
)

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    # 跳过健康检查和根路径的日志
    if request.url.path in ("/", "/health"):
        return await call_next(request)
    
    start_time = time.time()
    
    # 记录请求信息（使用 DEBUG 级别）
    logger.debug(f"📨 收到请求: {request.method} {request.url.path}")
    
    # 处理请求
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 只记录慢请求或错误响应
        if process_time > 1.0 or response.status_code >= 400:
            logger.warning(f"⚠️ 慢请求或错误: {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
        else:
            logger.debug(f"✅ 响应: {response.status_code} ({process_time:.3f}s)")
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"❌ 请求处理失败: {request.method} {request.url.path} - {e} ({process_time:.3f}s)")
        raise

# 注册路由
app.include_router(recognize_router, prefix="/api", tags=["食材识别"])
app.include_router(chat_router, prefix="/api", tags=["AI对话"])
app.include_router(recipe_router, prefix="/api", tags=["菜谱推荐"])
app.include_router(favorites_router, prefix="/api", tags=["收藏管理"])
app.include_router(history_router, prefix="/api", tags=["做菜历史"])
app.include_router(nutrition_router, prefix="/api", tags=["营养分析"])
app.include_router(users_router, prefix="/api", tags=["用户管理"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
