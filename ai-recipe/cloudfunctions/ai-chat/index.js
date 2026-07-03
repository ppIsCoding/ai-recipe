// AI对话云函数（完整版）
// 基于《中国居民膳食指南2022》的健康饮食顾问
// 流程：意图识别 → 策略映射 → 上下文增强 → 生成回复

const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 通义千问API配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-6713f5ff9e374b2392b6a2f872d519b1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3.6-flash'

// ========== 系统提示词 ==========
const SYSTEM_PROMPT = `你是"小厨"，基于《中国居民膳食指南2022》的健康饮食顾问。你专门为职场人士提供健康饮食建议。

你的核心能力：
1. 今晚吃什么：根据用户情况推荐简单健康的菜谱
2. 健康饮食：基于膳食指南提供营养建议
3. 烹饪技巧：分享简单易学的烹饪方法
4. 营养咨询：解答健康饮食相关问题

《中国居民膳食指南2022》八大准则：
1. 食物多样，合理搭配
2. 吃动平衡，健康体重
3. 多吃蔬果、奶类、全谷、大豆
4. 适量吃鱼、禽、蛋、瘦肉
5. 少盐少油，控糖限酒
6. 规律进餐，足量饮水
7. 会烹会选，会看标签
8. 公筷分餐，杜绝浪费

每日推荐摄入量：
- 谷薯类：200-300g
- 蔬菜：300-500g
- 水果：200-350g
- 肉禽鱼蛋：120-200g
- 奶制品：300-500g
- 盐：<5g，油：25-30g

回复要求：
- 简洁明了，分点说明
- 推荐菜谱时优先考虑轻烹饪（30分钟内）
- 强调健康价值（少盐少油、荤素搭配）
- 语气友好亲切，像一个专业的营养师朋友
- 回复控制在300字以内`

// ========== 意图回复策略 ==========
const INTENT_STRATEGIES = {
  recommend: {
    desc: '用户想要推荐菜谱',
    strategy: '请推荐2-3道具体菜谱，每道给出菜名、一句话亮点和推荐理由。优先推荐轻烹饪（30分钟内）的菜谱。'
  },
  recipe: {
    desc: '用户想了解具体做法',
    strategy: '请分步骤说明，包括食材用量、火候、关键技巧，步骤清晰易跟随。'
  },
  nutrition: {
    desc: '用户在咨询营养问题',
    strategy: '请基于《中国居民膳食指南2022》回答，引用具体数据，语气专业但易懂。'
  },
  health: {
    desc: '用户关注健康饮食',
    strategy: '请结合用户健康档案给出个性化建议，注意控制热量和营养均衡。'
  },
  skill: {
    desc: '用户想学习烹饪技巧',
    strategy: '请给出实用技巧，步骤简洁，适合新手。'
  },
  chat: {
    desc: '日常闲聊',
    strategy: ''
  }
}

// ========== 调用通义千问API ==========
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

// ========== 意图识别（关键词匹配） ==========
function recognizeIntent(message) {
  const msg = message.toLowerCase()
  
  // 推荐类
  if (msg.includes('推荐') || msg.includes('吃什么') || msg.includes('今晚') || 
      msg.includes('搭配') || msg.includes('做什么菜') || msg.includes('不知道吃啥')) {
    return 'recommend'
  }
  
  // 做法类
  if (msg.includes('做法') || msg.includes('怎么做') || msg.includes('烹饪') || 
      msg.includes('步骤') || msg.includes('制作') || msg.includes('料理')) {
    return 'recipe'
  }
  
  // 营养类
  if (msg.includes('营养') || msg.includes('热量') || msg.includes('蛋白质') || 
      msg.includes('维生素') || msg.includes('卡路里') || msg.includes('碳水')) {
    return 'nutrition'
  }
  
  // 健康类
  if (msg.includes('健康') || msg.includes('减脂') || msg.includes('增肌') || 
      msg.includes('减肥') || msg.includes('体重') || msg.includes('BMI')) {
    return 'health'
  }
  
  // 技巧类
  if (msg.includes('技巧') || msg.includes('窍门') || msg.includes('小妙招') || 
      msg.includes('怎么切') || msg.includes('怎么炒') || msg.includes('火候')) {
    return 'skill'
  }
  
  return 'chat'
}

// ========== 构建用户健康档案上下文 ==========
function buildUserProfileContext(userProfile) {
  if (!userProfile) return ''
  
  const parts = []
  
  // BMI信息
  if (userProfile.bmi) {
    const bmi = userProfile.bmi
    const bmiStatus = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖'
    parts.push(`BMI: ${bmi} (${bmiStatus})`)
  }
  
  // 健康目标
  if (userProfile.health_goal) {
    const goalMap = {
      'lose_weight': '减脂',
      'maintain': '维持体重',
      'gain_muscle': '增肌'
    }
    parts.push(`健康目标: ${goalMap[userProfile.health_goal] || '健康饮食'}`)
  }
  
  // TDEE（如果有）
  if (userProfile.tdee) {
    parts.push(`每日推荐热量: ${userProfile.tdee}kcal`)
  }
  
  return parts.length > 0 ? `用户健康档案：${parts.join(' | ')}` : ''
}

// ========== 构建用户偏好上下文 ==========
function buildPreferencesContext(userPreferences) {
  if (!userPreferences) return ''
  
  const parts = []
  
  if (userPreferences.taste && userPreferences.taste.length > 0) {
    parts.push(`口味偏好：${userPreferences.taste.join('、')}`)
  }
  
  if (userPreferences.avoid && userPreferences.avoid.length > 0) {
    parts.push(`忌口：${userPreferences.avoid.join('、')}`)
  }
  
  return parts.length > 0 ? parts.join('\n') : ''
}

// ========== 云函数入口函数 ==========
exports.main = async (event, context) => {
  const { message, user_id, chat_history, user_profile, user_preferences } = event
  
  try {
    console.log('💬 收到对话请求 - 用户ID:', user_id)
    console.log('💬 用户消息:', message)
    
    // 1. 意图识别
    const intent = recognizeIntent(message)
    console.log('🎯 识别意图:', intent)
    
    // 2. 构建system prompt
    let systemContent = SYSTEM_PROMPT
    
    // 添加意图策略
    const intentStrategy = INTENT_STRATEGIES[intent]
    if (intentStrategy && intentStrategy.strategy) {
      systemContent += `\n\n当前场景：${intentStrategy.desc}\n${intentStrategy.strategy}`
    }
    
    // 添加用户健康档案上下文
    const profileContext = buildUserProfileContext(user_profile)
    if (profileContext) {
      systemContent += `\n\n${profileContext}`
      systemContent += '\n请根据用户的健康状况提供个性化建议。'
    }
    
    // 添加用户偏好上下文
    const prefsContext = buildPreferencesContext(user_preferences)
    if (prefsContext) {
      systemContent += `\n${prefsContext}`
    }
    
    // 3. 构建消息列表
    const messages = [{ role: 'system', content: systemContent }]
    
    // 添加历史对话（最多10条）
    if (chat_history && chat_history.length > 0) {
      const recentHistory = chat_history.slice(-10)
      messages.push(...recentHistory)
    }
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: message })
    
    // 4. 调用AI生成回复
    const reply = await callQwen(messages, 0.7, 800)
    
    console.log('✅ 对话生成成功')
    
    return {
      success: true,
      reply: reply,
      intent: intent
    }
  } catch (err) {
    console.error('❌ 对话生成失败:', err)
    return {
      success: false,
      reply: '网络开小差了，请稍后再试～',
      intent: 'chat',
      error: err.message
    }
  }
}
