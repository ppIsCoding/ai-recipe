// AI菜谱推荐云函数（完整版）
// 基于《中国居民膳食指南2022》的健康菜谱推荐
// 流程：筛选 → 匹配 → 扩展搜索 → AI排序 → 格式化

const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 通义千问API配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-6713f5ff9e374b2392b6a2f872d519b1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3.6-flash'

// ========== 辅助函数 ==========

// 解析时间字符串为分钟数
function parseTimeMinutes(cookTime) {
  if (!cookTime) return 30
  const match = cookTime.match(/(\d+)/)
  return match ? parseInt(match[1]) : 30
}

// 健康评分计算（基于《中国居民膳食指南2022》）
function calculateHealthScore(recipe, userProfile) {
  let score = 50
  
  const healthTags = recipe.health_tags || []
  
  // 基于膳食指南的加分
  if (healthTags.includes('少盐')) score += 10
  if (healthTags.includes('少油')) score += 10
  if (healthTags.includes('高蛋白')) score += 5
  if (healthTags.includes('轻烹饪')) score += 5
  
  // 荤素搭配检查
  const ingredients = JSON.stringify(recipe.main_ingredients || [])
  const hasVegetable = ['蔬菜', '西兰花', '黄瓜', '番茄', '生菜', '菠菜', '白菜'].some(v => ingredients.includes(v))
  const hasProtein = ['鸡', '猪', '牛', '鱼', '虾', '蛋', '豆腐'].some(p => ingredients.includes(p))
  if (hasVegetable && hasProtein) score += 10
  
  // 根据用户健康目标调整
  if (userProfile) {
    const healthGoal = userProfile.health_goal || 'maintain'
    
    if (healthGoal === 'lose_weight') {
      if (healthTags.includes('少油')) score += 5
      const calories = (recipe.nutrition || {}).calories || 0
      if (calories <= 300) score += 5
    } else if (healthGoal === 'gain_muscle') {
      if (healthTags.includes('高蛋白')) score += 10
    }
    
    const bmi = userProfile.bmi
    if (bmi && bmi >= 24) {
      const calories = (recipe.nutrition || {}).calories || 0
      if (calories > 400) score -= 10
    }
  }
  
  return Math.max(0, Math.min(100, score))
}

// ========== 节点函数 ==========

// 1. 筛选轻烹饪菜谱
function filterQuickRecipes(recipes, maxTime, filterTags) {
  console.log(`⏱️ 筛选轻烹饪菜谱，最大时间: ${maxTime}分钟，标签: ${filterTags}`)
  
  let filtered = recipes.filter(recipe => {
    const timeMinutes = parseTimeMinutes(recipe.cook_time)
    return timeMinutes <= maxTime
  })
  
  // 标签筛选
  if (filterTags && filterTags.length > 0) {
    const tagFiltered = filtered.filter(recipe => {
      const recipeTags = recipe.health_tags || []
      return filterTags.some(tag => recipeTags.includes(tag))
    })
    if (tagFiltered.length >= 3) {
      filtered = tagFiltered
    }
  }
  
  // 如果筛选结果太少，放宽条件
  if (filtered.length < 3) {
    filtered = recipes.filter(r => parseTimeMinutes(r.cook_time) <= maxTime)
  }
  
  if (filtered.length < 3) {
    filtered = recipes
  }
  
  console.log(`✅ 筛选后剩余 ${filtered.length} 个菜谱`)
  return filtered
}

// 2. 食材匹配
function matchRecipes(filteredRecipes, foods) {
  console.log(`🔍 食材匹配，食材: ${foods}`)
  
  if (!foods || foods.length === 0) {
    return {
      matchedRecipes: filteredRecipes.slice(0, 6),
      matchQuality: 'good',
      matchScores: {}
    }
  }
  
  const scored = []
  for (const recipe of filteredRecipes) {
    let score = 0
    const matched = []
    for (const foodName of foods) {
      for (const ingredient of (recipe.main_ingredients || [])) {
        if (foodName.includes(ingredient) || ingredient.includes(foodName)) {
          score += 1
          matched.push(ingredient)
          break
        }
      }
    }
    if (score > 0) {
      scored.push({ recipe, score, matched })
    }
  }
  
  scored.sort((a, b) => b.score - a.score)
  const matchedRecipes = scored.slice(0, 6).map(item => item.recipe)
  const matchScores = {}
  scored.slice(0, 6).forEach(item => {
    matchScores[item.recipe.id] = item.score
  })
  
  // 判断匹配质量
  let matchQuality = 'poor'
  if (matchedRecipes.length >= 3) matchQuality = 'good'
  else if (matchedRecipes.length >= 1) matchQuality = 'medium'
  
  if (matchedRecipes.length === 0) {
    console.log('⚠️ 未找到匹配的菜谱，返回随机推荐')
    return {
      matchedRecipes: filteredRecipes.slice(0, 3),
      matchQuality: 'poor',
      matchScores: {}
    }
  }
  
  console.log(`✅ 匹配到 ${matchedRecipes.length} 个菜谱，质量: ${matchQuality}`)
  return { matchedRecipes, matchQuality, matchScores }
}

// 3. 扩展搜索
function expandSearch(currentRecipes, foods, allRecipes) {
  console.log(`🔍 扩展搜索，当前匹配 ${currentRecipes.length} 个菜谱`)
  
  const expanded = [...currentRecipes]
  const currentIds = new Set(currentRecipes.map(r => r.id))
  
  // 相似食材映射表
  const similarFoods = {
    '番茄': ['西红柿', '圣女果'],
    '土豆': ['马铃薯', '洋芋'],
    '猪肉': ['五花肉', '里脊肉', '瘦肉'],
    '鸡肉': ['鸡胸肉', '鸡腿肉'],
    '鸡蛋': ['蛋', '鸭蛋'],
    '虾': ['虾仁', '基围虾'],
    '鱼': ['鲈鱼', '草鱼', '鲫鱼'],
    '白菜': ['大白菜', '小白菜'],
    '黄瓜': ['青瓜'],
    '茄子': ['紫茄子'],
    '青椒': ['辣椒', '彩椒'],
    '豆腐': ['嫩豆腐', '老豆腐'],
    '牛肉': ['牛腩', '牛腱'],
    '羊肉': ['羊排'],
    '西兰花': ['花菜'],
  }
  
  // 策略1: 相似食材扩展
  if (foods && foods.length > 0) {
    const similar = []
    for (const food of foods) {
      for (const [key, values] of Object.entries(similarFoods)) {
        if (food.includes(key) || key.includes(food)) {
          similar.push(...values)
        }
      }
    }
    
    if (similar.length > 0) {
      console.log(`🔗 相似食材: ${similar.join(', ')}`)
      for (const recipe of allRecipes) {
        if (currentIds.has(recipe.id)) continue
        for (const food of similar) {
          for (const ingredient of (recipe.main_ingredients || [])) {
            if (food.includes(ingredient) || ingredient.includes(food)) {
              expanded.push(recipe)
              currentIds.add(recipe.id)
              break
            }
          }
        }
      }
    }
  }
  
  // 策略2: 同分类兜底
  if (expanded.length < 3) {
    const categories = new Set(currentRecipes.map(r => r.category))
    for (const recipe of allRecipes) {
      if (!currentIds.has(recipe.id) && categories.has(recipe.category)) {
        expanded.push(recipe)
        currentIds.add(recipe.id)
        if (expanded.length >= 6) break
      }
    }
  }
  
  // 策略3: 默认快手菜谱兜底
  if (expanded.length < 3) {
    const quickRecipes = allRecipes
      .filter(r => !currentIds.has(r.id) && parseTimeMinutes(r.cook_time) <= 15)
      .sort((a, b) => calculateHealthScore(b) - calculateHealthScore(a))
    expanded.push(...quickRecipes.slice(0, 3 - expanded.length))
  }
  
  console.log(`✅ 扩展搜索完成，共 ${expanded.length} 个菜谱`)
  return expanded.slice(0, 6)
}

// 4. AI排序并生成推荐说明
async function aiRankRecipes(recipes, userProfile, userPreferences) {
  console.log(`🤖 AI排序 ${recipes.length} 个菜谱...`)
  
  // 计算健康评分
  const scoredRecipes = recipes.map(recipe => ({
    recipe,
    healthScore: calculateHealthScore(recipe, userProfile)
  }))
  
  scoredRecipes.sort((a, b) => b.healthScore - a.healthScore)
  const sortedRecipes = scoredRecipes.map(item => item.recipe)
  const healthScores = {}
  scoredRecipes.forEach(item => {
    healthScores[item.recipe.id] = item.healthScore
  })
  
  // 生成推荐理由
  const recipeNames = sortedRecipes.slice(0, 6).map(r => r.name).join('、')
  let context = `可选菜谱：${recipeNames}`
  
  if (userPreferences) {
    if (userPreferences.taste && userPreferences.taste.length > 0) {
      context += `\n用户口味：${userPreferences.taste.join('、')}`
    }
    if (userPreferences.avoid && userPreferences.avoid.length > 0) {
      context += `\n用户忌口：${userPreferences.avoid.join('、')}`
    }
  }
  
  if (userProfile && userProfile.health_goal) {
    const goalMap = {
      'lose_weight': '减脂',
      'maintain': '维持体重',
      'gain_muscle': '增肌'
    }
    context += `\n健康目标：${goalMap[userProfile.health_goal] || '健康饮食'}`
  }
  
  const prompt = `基于《中国居民膳食指南2022》，为职场人士推荐今晚的健康菜谱。

${context}

要求：
1. 优先推荐轻烹饪（30分钟内）的菜谱
2. 考虑营养均衡（荤素搭配）
3. 用一两句话推荐最适合的菜谱，并说明为什么健康

直接给出推荐理由，不要列出菜谱清单。`

  const messages = [
    { role: 'system', content: '你是基于《中国居民膳食指南2022》的健康饮食顾问，专门为职场人士推荐简单健康的菜谱。' },
    { role: 'user', content: prompt }
  ]
  
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: QWEN_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const recommendations = response.data.choices[0].message.content
    console.log(`✅ AI推荐说明生成成功`)
    return { recommendations, healthScores }
  } catch (err) {
    console.warn(`⚠️ AI推荐说明生成失败: ${err.message}`)
    return {
      recommendations: '为您推荐以下轻烹饪健康菜谱，符合《中国居民膳食指南2022》建议，简单易做又营养。',
      healthScores
    }
  }
}

// 5. 格式化最终结果
function formatFinal(recipes, recommendations, healthScores, userProfile) {
  const results = recipes.map(recipe => {
    const healthScore = healthScores[recipe.id] || calculateHealthScore(recipe, userProfile)
    
    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description || '',
      difficulty: recipe.difficulty || '简单',
      cook_time: recipe.cook_time || '',
      servings: recipe.servings || '',
      main_ingredients: recipe.main_ingredients || [],
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      nutrition: recipe.nutrition || {},
      image_url: recipe.image_url || '',
      category: recipe.category || '家常菜',
      health_tags: recipe.health_tags || [],
      health_score: healthScore
    }
  })
  
  results.sort((a, b) => b.health_score - a.health_score)
  
  console.log(`📦 格式化完成，最终返回 ${results.length} 个菜谱`)
  return results
}

// ========== 主函数 ==========

exports.main = async (event, context) => {
  const { user_id, foods, user_preferences, user_profile, max_time, filter_tags } = event
  
  try {
    console.log('🍳 收到菜谱推荐请求')
    console.log(`👤 用户ID: ${user_id}`)
    console.log(`🥗 食材: ${foods}`)
    console.log(`⏱️ 最大时间: ${max_time}分钟`)
    console.log(`🏷️ 标签: ${filter_tags}`)
    
    // 1. 获取所有菜谱
    const { data: allRecipes } = await db.collection('recipes').limit(100).get()
    console.log(`📚 菜谱总数: ${allRecipes.length}`)
    
    // 2. 条件预筛选
    const filteredRecipes = filterQuickRecipes(allRecipes, max_time || 30, filter_tags)
    
    // 3. 食材匹配
    const { matchedRecipes, matchQuality, matchScores } = matchRecipes(filteredRecipes, foods)
    
    // 4. 匹配分档与扩展搜索
    let finalRecipes = matchedRecipes
    if (matchQuality !== 'good') {
      finalRecipes = expandSearch(matchedRecipes, foods, allRecipes)
    }
    
    // 5. AI排序并生成推荐说明
    const { recommendations, healthScores } = await aiRankRecipes(
      finalRecipes,
      user_profile,
      user_preferences
    )
    
    // 6. 格式化最终结果
    const formattedRecipes = formatFinal(finalRecipes, recommendations, healthScores, user_profile)
    
    console.log(`✅ 推荐完成，返回 ${formattedRecipes.length} 个菜谱`)
    
    return {
      success: true,
      recipes: formattedRecipes,
      recommendations: recommendations
    }
  } catch (err) {
    console.error('❌ 菜谱推荐失败:', err)
    
    // 降级：返回随机菜谱
    try {
      const { data: allRecipes } = await db.collection('recipes').limit(6).get()
      return {
        success: true,
        recipes: allRecipes.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          difficulty: r.difficulty || '简单',
          cook_time: r.cook_time || '',
          image_url: r.image_url || '',
          health_tags: r.health_tags || [],
          health_score: 50
        })),
        recommendations: '为您推荐热门菜谱'
      }
    } catch (fallbackErr) {
      return {
        success: false,
        recipes: [],
        recommendations: '',
        error: err.message
      }
    }
  }
}
