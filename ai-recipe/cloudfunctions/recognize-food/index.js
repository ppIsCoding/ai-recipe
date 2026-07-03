// 食材识别云函数
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 通义千问API配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-6713f5ff9e374b2392b6a2f872d519b1'

// 调用通义千问多模态模型识别食材
async function recognizeWithQwen(imageBase64) {
  const prompt = `你是一个专业的食材识别助手。请仔细识别这张图片中的所有**原材料/生鲜食材**，返回JSON数组格式。

要求：
- 只识别原材料和生鲜食材（如：鸡蛋、虾、猪肉、西红柿、土豆、牛奶等）
- 不要识别已经烹饪好的菜品（如：番茄炒蛋、红烧肉等成品菜）
- 如果图片中是成品菜，请识别出它用到的原材料
- 使用常见的中文食材名称

每个元素包含：
1. name: 食材名称（如：鸡蛋、虾、猪肉、西红柿）
2. category: 分类（蔬菜/水果/肉类/海鲜/蛋奶/主食/调料/其他）
3. shelf_life_days: 该食材在冰箱中的建议保存天数
4. probability: 你对识别结果的置信度（0-1之间的小数）

如果图片中没有食材或无法识别，返回空数组 []

请直接返回JSON数组，不要其他内容。示例：
[{"name":"鸡蛋","category":"蛋奶","shelf_life_days":21,"probability":0.95},{"name":"西红柿","category":"蔬菜","shelf_life_days":5,"probability":0.9}]`

  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen3.5-omni-flash',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的食材识别助手。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
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

// 云函数入口函数
exports.main = async (event, context) => {
  const { image_base64, user_id } = event

  try {
    if (!image_base64) {
      return {
        success: false,
        foods: [],
        count: 0,
        error: '请提供图片'
      }
    }

    console.log('📸 收到食材识别请求 - 用户ID:', user_id)
    console.log('🖼️ 图片大小:', image_base64.length, 'bytes')

    // 调用多模态模型识别
    console.log('🤖 调用通义千问多模态识别...')
    const content = await recognizeWithQwen(image_base64)
    console.log('🤖 AI响应:', content)

    // 解析JSON
    let foods = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          foods = parsed.map(item => ({
            name: item.name || '',
            category: item.category || '其他',
            shelf_life_days: item.shelf_life_days || 3,
            probability: item.probability || 0.9
          }))
        }
      }
    } catch (parseErr) {
      console.warn('解析AI响应失败:', parseErr)
    }

    console.log('✅ 识别到', foods.length, '个食材')
    if (foods.length > 0) {
      console.log('📋 食材列表:', foods.map(f => f.name).join(', '))
    }

    return {
      success: foods.length > 0,
      foods: foods,
      count: foods.length
    }
  } catch (err) {
    console.error('❌ 食材识别失败:', err)
    return {
      success: false,
      foods: [],
      count: 0,
      error: err.message || '识别失败'
    }
  }
}
