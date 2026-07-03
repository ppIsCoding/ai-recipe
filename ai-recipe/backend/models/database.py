"""
数据库连接管理
"""

from __future__ import annotations

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

logger = logging.getLogger("AIRecipe.Database")

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # 生产环境不输出SQL日志
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """获取数据库会话（依赖注入用）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库连接（不自动建表，表已手动创建）"""
    try:
        # 测试连接
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ 数据库连接成功")
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        raise
