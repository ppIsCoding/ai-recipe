// 健康分析云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 计算BMI
function calculateBMI(weight, height) {
  const heightM = height / 100
  return weight / (heightM * heightM)
}

// 获取BMI状态（中国标准）
function getBMIStatus(bmi) {
  if (bmi < 18.5) return { status: '偏瘦', en: 'underweight' }
  if (bmi < 24) return { status: '正常', en: 'normal' }
  if (bmi < 28) return { status: '超重', en: 'overweight' }
  return { status: '肥胖', en: 'obese' }
}

// 计算基础代谢率（BMR）- Mifflin-St Jeor公式
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

// 获取活动系数
function getActivityCoefficient(activityLevel) {
  const coefficients = {
    'sedentary': 1.2,      // 久坐不动
    'light': 1.375,        // 轻度活动
    'moderate': 1.55,      // 中度活动
    'active': 1.725        // 重度活动
  }
  return coefficients[activityLevel] || 1.2
}

// 计算目标热量
function calculateTargetCalories(tdee, healthGoal) {
  if (healthGoal === 'lose_weight') return tdee - 400
  if (healthGoal === 'gain_muscle') return tdee + 400
  return tdee
}

// 计算营养素目标
function getNutritionTargets(targetCalories, healthGoal) {
  let proteinRatio, fatRatio, carbsRatio
  
  if (healthGoal === 'lose_weight') {
    proteinRatio = 0.30
    fatRatio = 0.25
    carbsRatio = 0.45
  } else if (healthGoal === 'gain_muscle') {
    proteinRatio = 0.30
    fatRatio = 0.25
    carbsRatio = 0.45
  } else {
    proteinRatio = 0.20
    fatRatio = 0.25
    carbsRatio = 0.55
  }
  
  const proteinG = targetCalories * proteinRatio / 4
  const fatG = targetCalories * fatRatio / 9
  const carbsG = targetCalories * carbsRatio / 4
  
  return {
    protein: `${Math.round(proteinG)}-${Math.round(proteinG * 1.2)}g`,
    fat: `${Math.round(fatG * 0.8)}-${Math.round(fatG)}g`,
    carbs: `${Math.round(carbsG * 0.9)}-${Math.round(carbsG)}g`
  }
}

// 获取健康建议
function getHealthAdvice(bmiStatus, healthGoal) {
  const advice = []
  
  // 通用建议
  advice.push('遵循《中国居民膳食指南2022》八大准则')
  advice.push('每日盐<5g，油25-30g')
  advice.push('蔬菜300-500g，水果200-350g')
  
  if (bmiStatus === 'underweight') {
    advice.push('适当增加热量摄入，选择营养密度高的食物')
    advice.push('增加优质蛋白：鸡蛋、瘦肉、奶制品')
    advice.push('少食多餐，配合力量训练')
  } else if (bmiStatus === 'overweight' || bmiStatus === 'obese') {
    advice.push('控制总热量，减少精制碳水')
    advice.push('增加蔬菜摄入（500g以上），选择低脂蛋白')
    advice.push('减少烹调油用量，避免高糖食物')
    advice.push('增加运动量，每周至少150分钟中等强度运动')
  } else {
    advice.push('保持均衡饮食，食物多样')
    advice.push('肉禽鱼蛋120-200g，奶制品300-500g')
  }
  
  if (healthGoal === 'lose_weight') {
    advice.push('减脂期每日热量减少300-500kcal')
    advice.push('优先选择轻烹饪菜谱（少油少盐）')
  } else if (healthGoal === 'gain_muscle') {
    advice.push('增肌期每日热量增加300-500kcal')
    advice.push('每餐搭配优质蛋白，配合力量训练')
  }
  
  return advice
}

// 获取膳食指南小贴士
function getDietaryGuideTips() {
  return [
    '食物多样，合理搭配 - 每天12种以上食物',
    '吃动平衡，健康体重 - 每周至少150分钟运动',
    '多吃蔬果、奶类、全谷、大豆 - 餐餐有蔬菜',
    '适量吃鱼、禽、蛋、瘦肉 - 优先选择鱼和禽',
    '少盐少油，控糖限酒 - 使用限盐勺',
    '规律进餐，足量饮水 - 每天1500-1700ml'
  ]
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { openid } = event
  
  try {
    if (!openid) {
      return {
        success: false,
        message: '缺少用户ID',
        analysis: null
      }
    }
    
    // 获取用户信息
    const { data: users } = await db.collection('users').where({
      id: openid
    }).get()
    
    if (users.length === 0) {
      return {
        success: false,
        message: '用户不存在',
        analysis: null
      }
    }
    
    const user = users[0]
    
    // 检查是否填写了必要信息
    if (!user.weight || !user.height || !user.age || !user.gender) {
      return {
        success: false,
        message: '请先完善个人信息（性别、年龄、身高、体重）',
        analysis: null
      }
    }
    
    const weight = parseFloat(user.weight)
    const height = parseFloat(user.height)
    const age = user.age
    const gender = user.gender
    const activityLevel = user.activity_level || 'sedentary'
    const healthGoal = user.health_goal || 'maintain'
    
    // 计算BMI
    const bmi = calculateBMI(weight, height)
    const bmiResult = getBMIStatus(bmi)
    
    // 计算BMR和TDEE
    const bmr = calculateBMR(weight, height, age, gender)
    const activityCoeff = getActivityCoefficient(activityLevel)
    const tdee = bmr * activityCoeff
    
    // 计算目标热量
    const targetCalories = calculateTargetCalories(tdee, healthGoal)
    
    // 计算营养素目标
    const nutritionTargets = getNutritionTargets(targetCalories, healthGoal)
    
    // 获取健康建议
    const healthAdvice = getHealthAdvice(bmiResult.en, healthGoal)
    const dietaryGuideTips = getDietaryGuideTips()
    
    return {
      success: true,
      analysis: {
        bmi: Math.round(bmi * 10) / 10,
        bmi_status: bmiResult.status,
        bmi_status_en: bmiResult.en,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target_calories: Math.round(targetCalories),
        protein_target: nutritionTargets.protein,
        fat_target: nutritionTargets.fat,
        carbs_target: nutritionTargets.carbs,
        health_advice: healthAdvice,
        dietary_guide_tips: dietaryGuideTips
      }
    }
  } catch (err) {
    console.error('健康分析失败:', err)
    return {
      success: false,
      message: err.message || '分析失败',
      analysis: null
    }
  }
}
