"""
用户登录API
基于《中国居民膳食指南2022》的健康分析功能
"""

from __future__ import annotations

import httpx
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from config import settings
from models.database import get_db
from models.tables import User

router = APIRouter()
logger = logging.getLogger("AIRecipe.API.Users")


class LoginRequest(BaseModel):
    code: str
    nickname: str = ""
    avatar_url: str = ""


class UserInfo(BaseModel):
    openid: str
    nickname: str
    avatar_url: str
    taste: list = []
    avoid: list = []
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: str = "sedentary"
    health_goal: str = "maintain"


class LoginResponse(BaseModel):
    success: bool
    user: UserInfo = None
    message: str = ""


async def code2session(code: str) -> dict:
    """用微信 code 换取 openid 和 session_key"""
    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": settings.WECHAT_APPID,
        "secret": settings.WECHAT_SECRET,
        "js_code": code,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        data = resp.json()

    logger.info(f"微信 code2session 响应: {data}")

    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(
            status_code=400,
            detail=f"微信登录失败: {data.get('errmsg', '未知错误')}",
        )

    return data


@router.post("/users/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """用户登录- 用微信 code 换取 openid"""
    try:
        # 1. 用 code 换取 openid
        wx_data = await code2session(req.code)
        openid = wx_data.get("openid")

        if not openid:
            return LoginResponse(success=False, message="获取openid失败")

        logger.info(f"用户登录, openid: {openid}")

        # 2. 查找或创建用户
        user = db.query(User).filter(User.id == openid).first()

        if user:
            # 更新用户信息
            if req.nickname:
                user.nickname = req.nickname
            if req.avatar_url:
                user.avatar_url = req.avatar_url
            db.commit()
            db.refresh(user)
        else:
            # 创建新用户
            user = User(
                id=openid,
                nickname=req.nickname or "微信用户",
                avatar_url=req.avatar_url or "",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return LoginResponse(
            success=True,
            user=UserInfo(
                openid=user.id,
                nickname=user.nickname or "",
                avatar_url=user.avatar_url or "",
                taste=user.taste or [],
                avoid=user.avoid or [],
                gender=user.gender,
                age=user.age,
                height=float(user.height) if user.height else None,
                weight=float(user.weight) if user.weight else None,
                activity_level=user.activity_level or "sedentary",
                health_goal=user.health_goal or "maintain",
            ),
            message="登录成功",
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"登录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/info", response_model=LoginResponse)
async def get_user_info(openid: str = "", db: Session = Depends(get_db)):
    """获取用户信息"""
    try:
        user = db.query(User).filter(User.id == openid).first()
        if not user:
            return LoginResponse(success=False, message="用户不存在")

        return LoginResponse(
            success=True,
            user=UserInfo(
                openid=user.id,
                nickname=user.nickname or "",
                avatar_url=user.avatar_url or "",
                taste=user.taste or [],
                avoid=user.avoid or [],
                gender=user.gender,
                age=user.age,
                height=float(user.height) if user.height else None,
                weight=float(user.weight) if user.weight else None,
                activity_level=user.activity_level or "sedentary",
                health_goal=user.health_goal or "maintain",
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PreferencesRequest(BaseModel):
    openid: str
    taste: str = ""
    avoid: str = ""


@router.put("/users/preferences")
async def update_preferences(req: PreferencesRequest, db: Session = Depends(get_db)):
    """更新用户偏好"""
    try:
        user = db.query(User).filter(User.id == req.openid).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        if req.taste:
            user.taste = [t.strip() for t in req.taste.split(",")]
        if req.avoid:
            user.avoid = [a.strip() for a in req.avoid.split(",")]

        db.commit()
        return {"success": True, "message": "偏好已更新"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ========== 个人信息和健康分析 ==========

class ProfileRequest(BaseModel):
    openid: str
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    health_goal: Optional[str] = None


class HealthAnalysis(BaseModel):
    bmi: Optional[float] = None
    bmi_status: str = ""
    bmi_status_en: str = ""
    bmr: Optional[float] = None  # 基础代谢率
    tdee: Optional[float] = None  # 每日总消耗
    target_calories: Optional[float] = None  # 目标热量
    protein_target: Optional[str] = None
    fat_target: Optional[str] = None
    carbs_target: Optional[str] = None
    health_advice: list = []
    dietary_guide_tips: list = []


def calculate_bmi(weight: float, height: float) -> float:
    """计算BMI"""
    height_m = height / 100
    return weight / (height_m * height_m)


def get_bmi_status(bmi: float) -> tuple:
    """
    获取BMI状态（中国标准）
    参考：《中国成人超重和肥胖症预防控制指南》
    """
    if bmi < 18.5:
        return "偏瘦", "underweight"
    elif bmi < 24:
        return "正常", "normal"
    elif bmi < 28:
        return "超重", "overweight"
    else:
        return "肥胖", "obese"


def calculate_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """
    计算基础代谢率（BMR）
    使用 Mifflin-St Jeor 公式
    """
    if gender == "male":
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:
        return 10 * weight + 6.25 * height - 5 * age - 161


def get_activity_coefficient(activity_level: str) -> float:
    """获取活动系数"""
    coefficients = {
        "sedentary": 1.2,      # 久坐不动
        "light": 1.375,        # 轻度活动（每周1-3次）
        "moderate": 1.55,      # 中度活动（每周3-5次）
        "active": 1.725,       # 重度活动（每周6-7次）
    }
    return coefficients.get(activity_level, 1.2)


def calculate_target_calories(tdee: float, health_goal: str) -> float:
    """根据健康目标计算目标热量"""
    if health_goal == "lose_weight":
        return tdee - 400  # 减脂：减少400kcal
    elif health_goal == "gain_muscle":
        return tdee + 400  # 增肌：增加400kcal
    else:
        return tdee  # 维持


def get_nutrition_targets(target_calories: float, health_goal: str) -> dict:
    """
    根据目标热量计算营养素目标
    参考《中国居民膳食指南2022》
    """
    if health_goal == "lose_weight":
        # 减脂：高蛋白、低脂、适量碳水
        protein_ratio = 0.30
        fat_ratio = 0.25
        carbs_ratio = 0.45
    elif health_goal == "gain_muscle":
        # 增肌：高蛋白、适量脂、高碳水
        protein_ratio = 0.30
        fat_ratio = 0.25
        carbs_ratio = 0.45
    else:
        # 维持：均衡
        protein_ratio = 0.20
        fat_ratio = 0.25
        carbs_ratio = 0.55
    
    # 1g蛋白质=4kcal, 1g脂肪=9kcal, 1g碳水=4kcal
    protein_g = target_calories * protein_ratio / 4
    fat_g = target_calories * fat_ratio / 9
    carbs_g = target_calories * carbs_ratio / 4
    
    return {
        "protein": f"{int(protein_g)}-{int(protein_g * 1.2)}g",
        "fat": f"{int(fat_g * 0.8)}-{int(fat_g)}g",
        "carbs": f"{int(carbs_g * 0.9)}-{int(carbs_g)}g",
    }


def get_health_advice(bmi_status: str, health_goal: str) -> list:
    """获取健康建议（基于膳食指南2022）"""
    advice = []
    
    # 通用建议（膳食指南准则）
    advice.append("遵循《中国居民膳食指南2022》八大准则")
    advice.append("每日盐<5g，油25-30g")
    advice.append("蔬菜300-500g，水果200-350g")
    
    if bmi_status == "underweight":
        advice.append("适当增加热量摄入，选择营养密度高的食物")
        advice.append("增加优质蛋白：鸡蛋、瘦肉、奶制品")
        advice.append("少食多餐，配合力量训练")
    elif bmi_status == "overweight" or bmi_status == "obese":
        advice.append("控制总热量，减少精制碳水")
        advice.append("增加蔬菜摄入（500g以上），选择低脂蛋白")
        advice.append("减少烹调油用量，避免高糖食物")
        advice.append("增加运动量，每周至少150分钟中等强度运动")
    else:
        advice.append("保持均衡饮食，食物多样")
        advice.append("肉禽鱼蛋120-200g，奶制品300-500g")
    
    if health_goal == "lose_weight":
        advice.append("减脂期每日热量减少300-500kcal")
        advice.append("优先选择轻烹饪菜谱（少油少盐）")
    elif health_goal == "gain_muscle":
        advice.append("增肌期每日热量增加300-500kcal")
        advice.append("每餐搭配优质蛋白，配合力量训练")
    
    return advice


def get_dietary_guide_tips() -> list:
    """获取膳食指南小贴士"""
    return [
        "食物多样，合理搭配 - 每天12种以上食物",
        "吃动平衡，健康体重 - 每周至少150分钟运动",
        "多吃蔬果、奶类、全谷、大豆 - 餐餐有蔬菜",
        "适量吃鱼、禽、蛋、瘦肉 - 优先选择鱼和禽",
        "少盐少油，控糖限酒 - 使用限盐勺",
        "规律进餐，足量饮水 - 每天1500-1700ml",
    ]


@router.put("/users/profile")
async def update_profile(req: ProfileRequest, db: Session = Depends(get_db)):
    """更新用户个人信息"""
    try:
        user = db.query(User).filter(User.id == req.openid).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        if req.gender is not None:
            user.gender = req.gender
        if req.age is not None:
            user.age = req.age
        if req.height is not None:
            user.height = req.height
        if req.weight is not None:
            user.weight = req.weight
        if req.activity_level is not None:
            user.activity_level = req.activity_level
        if req.health_goal is not None:
            user.health_goal = req.health_goal

        db.commit()
        return {"success": True, "message": "个人信息已更新"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/health-analysis")
async def get_health_analysis(openid: str = "", db: Session = Depends(get_db)):
    """获取健康分析（基于《中国居民膳食指南2022》）"""
    try:
        user = db.query(User).filter(User.id == openid).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 检查是否填写了必要信息
        if not user.weight or not user.height or not user.age or not user.gender:
            return {
                "success": False,
                "message": "请先完善个人信息（性别、年龄、身高、体重）",
                "analysis": None,
            }

        weight = float(user.weight)
        height = float(user.height)
        age = user.age
        gender = user.gender
        activity_level = user.activity_level or "sedentary"
        health_goal = user.health_goal or "maintain"

        # 计算BMI
        bmi = calculate_bmi(weight, height)
        bmi_status, bmi_status_en = get_bmi_status(bmi)

        # 计算BMR和TDEE
        bmr = calculate_bmr(weight, height, age, gender)
        activity_coeff = get_activity_coefficient(activity_level)
        tdee = bmr * activity_coeff

        # 计算目标热量
        target_calories = calculate_target_calories(tdee, health_goal)

        # 计算营养素目标
        nutrition_targets = get_nutrition_targets(target_calories, health_goal)

        # 获取健康建议
        health_advice = get_health_advice(bmi_status, health_goal)
        dietary_guide_tips = get_dietary_guide_tips()

        analysis = HealthAnalysis(
            bmi=round(bmi, 1),
            bmi_status=bmi_status,
            bmi_status_en=bmi_status_en,
            bmr=round(bmr, 0),
            tdee=round(tdee, 0),
            target_calories=round(target_calories, 0),
            protein_target=nutrition_targets["protein"],
            fat_target=nutrition_targets["fat"],
            carbs_target=nutrition_targets["carbs"],
            health_advice=health_advice,
            dietary_guide_tips=dietary_guide_tips,
        )

        return {
            "success": True,
            "analysis": analysis.dict(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"健康分析失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
