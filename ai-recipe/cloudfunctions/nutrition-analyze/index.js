// 营养分析云函数
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 通义千问API配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-6713f5ff9e374b2392b6a2f872d519b1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3.6-flash'

// 调用通义千问API
async function callQwen(messages, temperature = 0.7, maxTokens = 800) {
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: QWEN_MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return response.data.choices[0].message.content
  } catch (err) {
    console.error('调用通义千问失败:', err.message)
    throw err
  }
}

// 生成缓存key
function getFoodsKey(foods) {
  const sorted = foods.slice().sort()
  return sorted.join(',')
}

// 分析食材营养成分
async function analyzeNutrition(foods) {
  const foodStr = foods.join('、')
  
  const prompt = `请分析以下食材的营养成分，返回JSON数组格式。
每个元素包含：
- name: 食材名称
- calories: 热量(kcal，每100g)
- protein: 蛋白质(g)
- fat: 脂肪(g)
- carbs: 碳水化合物(g)
- fiber: 膳食纤维(g)
- vitamins: 主要维生素(字符串)

食材：${foodStr}

请直接返回JSON数组，不要其他内容。示例：
[{"name":"番茄","calories":18,"protein":0.9,"fat":0.2,"carbs":3.9,"fiber":1.2,"vitamins":"维生素C、维生素A"}]`

  const messages = [
    { role: 'system', content: '你是一个营养分析专家，负责分析食材的营养成分。只返回JSON格式数据。' },
    { role: 'user', content: prompt }
  ]
  
  try {
    const result = await callQwen(messages, 0.1, 800)
    // 提取JSON部分
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (err) {
    console.error('分析营养成分失败:', err)
    return []
  }
}

// 计算总营养
function calculateTotal(nutritionData) {
  const total = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  
  for (const item of nutritionData) {
    if (typeof item === 'object') {
      total.calories += item.calories || 0
      total.protein += item.protein || 0
      total.fat += item.fat || 0
      total.carbs += item.carbs || 0
      total.fiber += item.fiber || 0
    }
  }
  
  // 四舍五入
  for (const key in total) {
    total[key] = Math.round(total[key] * 10) / 10
  }
  
  return total
}

// 生成健康建议
async function generateAdvice(foods, total) {
  const foodStr = foods.join('、')
  
  const prompt = `根据以下食材和营养数据，给出健康饮食建议（200字以内）。

食材：${foodStr}
总热量：${total.calories}kcal
蛋白质：${total.protein}g
脂肪：${total.fat}g
碳水：${total.carbs}g

请给出：
1. 这顿饭的营养评价
2. 适合什么人群
3. 搭配建议`

  const messages = [
    { role: 'system', content: '你是一个专业的营养师，负责给出健康饮食建议。回复简洁明了。' },
    { role: 'user', content: prompt }
  ]
  
  try {
    return await callQwen(messages, 0.7, 300)
  } catch (err) {
    return '这是一道营养均衡的菜品，建议搭配主食一起食用。'
  }
}

// 推荐做法
async function suggestRecipes(foods) {
  const foodStr = foods.join('、')
  
  const prompt = `根据以下食材，推荐2-3种简单的做法名称，返回JSON数组。
食材：${foodStr}

只返回做法名称数组，示例：["番茄炒蛋","番茄蛋汤","番茄沙拉"]`

  const messages = [
    { role: 'system', content: '你是一个厨师，负责推荐做法。只返回JSON数组。' },
    { role: 'user', content: prompt }
  ]
  
  try {
    const result = await callQwen(messages, 0.7, 200)
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (err) {
    return []
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { foods, user_id } = event
  
  try {
    if (!foods || foods.length === 0) {
      return { success: false, error: '请提供食材列表' }
    }
    
    console.log('🥗 营养分析请求 - 食材:', foods)
    
    // 1. 检查缓存
    const foodsKey = getFoodsKey(foods)
    try {
      const { data: cached } = await db.collection('nutrition_logs').where({
        foods_key: foodsKey
      }).get()
      
      if (cached.length > 0) {
        console.log('✅ 缓存命中，直接返回缓存数据')
        return {
          success: true,
          foods: cached[0].foods || [],
          total: {
            calories: cached[0].total_calories || 0,
            protein: cached[0].total_protein || 0,
            fat: cached[0].total_fat || 0,
            carbs: cached[0].total_carbs || 0
          },
          health_advice: cached[0].health_advice || '',
          recommended_recipes: cached[0].recommended_recipes || []
        }
      }
    } catch (e) {
      console.warn('查询缓存失败:', e)
    }
    
    // 2. 缓存未命中，调用AI分析
    console.log('🔄 缓存未命中，调用AI分析...')
    
    // 并行调用3个API
    const [nutritionData, healthAdvice, recommendedRecipes] = await Promise.all([
      analyzeNutrition(foods),
      generateAdvice(foods, { calories: 0, protein: 0, fat: 0, carbs: 0 }),
      suggestRecipes(foods)
    ])
    
    console.log('📊 营养数据:', nutritionData)
    
    // 计算总营养
    const total = calculateTotal(nutritionData)
    console.log('📊 总营养:', total)
    
    // 3. 保存到数据库缓存
    try {
      await db.collection('nutrition_logs').add({
        data: {
          foods_key: foodsKey,
          foods: nutritionData,
          total_calories: total.calories,
          total_protein: total.protein,
          total_fat: total.fat,
          total_carbs: total.carbs,
          health_advice: healthAdvice,
          recommended_recipes: recommendedRecipes,
          created_at: db.serverDate()
        }
      })
      console.log('💾 已保存到数据库缓存')
    } catch (e) {
      console.warn('保存营养缓存失败:', e)
    }
    
    console.log('✅ 营养分析完成')
    
    return {
      success: true,
      foods: nutritionData,
      total: total,
      health_advice: healthAdvice,
      recommended_recipes: recommendedRecipes
    }
  } catch (err) {
    console.error('❌ 营养分析失败:', err)
    return {
      success: false,
      error: err.message || '分析失败'
    }
  }
}
