"""
数据库表定义
基于《中国居民膳食指南2022》的健康菜谱推荐系统
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    JSON,
    ForeignKey,
    UniqueConstraint,
    DECIMAL,
)
from sqlalchemy.orm import relationship

from models.database import Base


class User(Base):
    """用户表"""

    __tablename__ = "users"

    id = Column(String(64), primary_key=True, comment="微信openid")
    nickname = Column(String(100), default="", comment="昵称")
    avatar_url = Column(Text, default="", comment="头像URL")
    taste = Column(JSON, default=list, comment="口味偏好")
    avoid = Column(JSON, default=list, comment="忌口")
    created_at = Column(DateTime, default=datetime.now)
    
    # 个人信息字段
    gender = Column(String(10), comment="性别: male/female")
    age = Column(Integer, comment="年龄")
    height = Column(DECIMAL(5, 1), comment="身高(cm)")
    weight = Column(DECIMAL(5, 1), comment="体重(kg)")
    activity_level = Column(String(20), default="sedentary", comment="活动量: sedentary/light/moderate/active")
    health_goal = Column(String(20), default="maintain", comment="健康目标: lose_weight/maintain/gain_muscle")

    favorites = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )
    cook_history = relationship(
        "CookHistory", back_populates="user", cascade="all, delete-orphan"
    )


class Recipe(Base):
    """菜谱表"""

    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="菜谱名称")
    description = Column(Text, default="", comment="描述")
    difficulty = Column(String(10), default="简单", comment="难度")
    cook_time = Column(String(20), default="", comment="烹饪时间")
    servings = Column(String(20), default="", comment="份量")
    main_ingredients = Column(JSON, default=list, comment="主要食材")
    ingredients = Column(JSON, default=list, comment="完整食材清单")
    steps = Column(JSON, default=list, comment="步骤")
    nutrition = Column(JSON, default=dict, comment="营养成分")
    image_url = Column(Text, default="", comment="图片URL")
    category = Column(String(20), default="家常菜", comment="分类")
    
    # 健康标签字段
    health_tags = Column(JSON, default=list, comment="健康标签: 少盐/少油/高蛋白/轻烹饪")
    oil_per_serving = Column(DECIMAL(5, 1), default=0, comment="每份用油量(g)")
    salt_per_serving = Column(DECIMAL(5, 1), default=0, comment="每份用盐量(g)")
    fiber_per_serving = Column(DECIMAL(5, 1), default=0, comment="每份膳食纤维(g)")


class Favorite(Base):
    """收藏表"""

    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uk_user_recipe"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    recipe_id = Column(Integer, nullable=False, comment="菜谱ID")
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="favorites")


class CookHistory(Base):
    """做菜历史表"""

    __tablename__ = "cook_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    recipe_id = Column(Integer, nullable=False, comment="菜谱ID")
    recipe_name = Column(String(100), default="", comment="菜谱名称")
    cook_time = Column(Integer, default=0, comment="烹饪时长(分钟)")
    rating = Column(Integer, default=5, comment="评分(1-5)")
    note = Column(Text, default="", comment="备注")
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="cook_history")


class NutritionLog(Base):
    """营养分析缓存表"""

    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    foods_key = Column(String(128), unique=True, nullable=False, comment="食材组合的hash key")
    foods = Column(JSON, nullable=False, comment="分析的食材列表")
    total_calories = Column(Integer, default=0, comment="总热量(kcal)")
    total_protein = Column(Integer, default=0, comment="总蛋白质(g)")
    total_fat = Column(Integer, default=0, comment="总脂肪(g)")
    total_carbs = Column(Integer, default=0, comment="总碳水(g)")
    health_advice = Column(Text, default="", comment="健康建议")
    recommended_recipes = Column(JSON, default=list, comment="推荐做法")
    created_at = Column(DateTime, default=datetime.now)
