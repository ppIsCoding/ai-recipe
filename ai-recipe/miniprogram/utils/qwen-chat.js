/**
 * 通义千问AI对话工具（云函数版本）
 * 调用云函数进行智能对话
 */

var auth = require('./auth.js')

// 对话历史记录（保留最近10轮）
var chatHistory = []
var MAX_HISTORY = 20

/**
 * 发送消息到AI云函数
 * @param {string} message - 用户消息
 * @returns {Promise<Object>} AI回复
 */
function sendMessage(message) {
  return new Promise(function (resolve, reject) {
    // 获取用户健康档案
    var healthData = wx.getStorageSync('healthData') || {}
    var userProfile = {
      bmi: healthData.bmi ? parseFloat(healthData.bmi) : null,
      health_goal: healthData.healthGoal || 'maintain',
      tdee: healthData.tdee || null
    }
    
    // 获取用户偏好
    var preference = wx.getStorageSync('preference') || {}
    var userPreferences = {
      taste: preference.taste || [],
      avoid: preference.avoid || []
    }
    
    wx.cloud.callFunction({
      name: 'ai-chat',
      data: {
        message: message,
        user_id: auth.getUserId() || 'default',
        chat_history: chatHistory.slice(-10),
        user_profile: userProfile,
        user_preferences: userPreferences
      },
      success: function (res) {
        console.log('云函数对话返回:', JSON.stringify(res.result))

        if (res.result && res.result.success) {
          var reply = res.result.reply

          // 更新对话历史
          chatHistory.push({ role: 'user', content: message })
          chatHistory.push({ role: 'assistant', content: reply })

          // 限制历史长度
          while (chatHistory.length > MAX_HISTORY) {
            chatHistory.shift()
            chatHistory.shift()
          }

          resolve({
            success: true,
            reply: reply,
            intent: res.result.intent || ''
          })
        } else {
          reject(new Error(res.result ? res.result.reply : '请求失败'))
        }
      },
      fail: function (err) {
        console.error('对话云函数调用失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 流式发送消息（云函数版本，降级为非流式）
 * @param {string} message - 用户消息
 * @param {Object} callbacks - 回调函数
 */
function sendStreamMessage(message, callbacks) {
  // 云函数不支持流式，降级为非流式
  sendMessage(message).then(function (result) {
    if (callbacks.onIntent && result.intent) {
      callbacks.onIntent(result.intent)
    }
    if (callbacks.onContent) {
      callbacks.onContent(result.reply)
    }
    if (callbacks.onDone) {
      callbacks.onDone()
    }
  }).catch(function (err) {
    if (callbacks.onError) {
      callbacks.onError(err)
    }
  })
  
  // 返回一个模拟的requestTask对象
  return {
    abort: function () {}
  }
}

/**
 * 清空对话历史
 */
function clearHistory() {
  chatHistory = []
}

/**
 * 获取对话历史
 */
function getHistory() {
  return chatHistory.slice()
}

/**
 * 更新对话历史（流式完成后调用）
 */
function addToHistory(userMessage, assistantReply) {
  chatHistory.push({ role: 'user', content: userMessage })
  chatHistory.push({ role: 'assistant', content: assistantReply })
  while (chatHistory.length > MAX_HISTORY) {
    chatHistory.shift()
    chatHistory.shift()
  }
}

/**
 * 获取快捷问题列表（按时段变化）
 */
function getQuickQuestions() {
  var hour = new Date().getHours()

  if (hour >= 6 && hour < 10) {
    // 早餐时段
    return [
      { id: 1, text: '快手早餐推荐', icon: '🌅' },
      { id: 2, text: '早餐营养怎么搭配', icon: '🥛' },
      { id: 3, text: '减脂早餐怎么做', icon: '🥗' },
      { id: 4, text: '早餐5分钟能做什么', icon: '⏱️' }
    ]
  } else if (hour >= 10 && hour < 14) {
    // 午餐时段
    return [
      { id: 1, text: '推荐几道家常菜', icon: '🥘' },
      { id: 2, text: '减脂餐怎么搭配', icon: '🥗' },
      { id: 3, text: '上班族带饭推荐', icon: '🍱' },
      { id: 4, text: '15分钟能做什么', icon: '⏱️' }
    ]
  } else if (hour >= 14 && hour < 17) {
    // 下午茶时段
    return [
      { id: 1, text: '健康小零食推荐', icon: '🍪' },
      { id: 2, text: '下午茶吃什么不胖', icon: '☕' },
      { id: 3, text: '水果怎么搭配', icon: '🍎' },
      { id: 4, text: '低卡饮品推荐', icon: '🧃' }
    ]
  } else if (hour >= 17 && hour < 21) {
    // 晚餐时段
    return [
      { id: 1, text: '今晚吃什么', icon: '🌙' },
      { id: 2, text: '新手入门做什么菜', icon: '📖' },
      { id: 3, text: '番茄炒蛋怎么做', icon: '🍳' },
      { id: 4, text: '两人份晚餐推荐', icon: '👫' }
    ]
  } else {
    // 夜宵时段
    return [
      { id: 1, text: '夜宵吃什么不胖', icon: '🌙' },
      { id: 2, text: '简单汤品推荐', icon: '🍲' },
      { id: 3, text: '助眠食物有哪些', icon: '😴' },
      { id: 4, text: '轻食代餐推荐', icon: '🥗' }
    ]
  }
}

module.exports = {
  sendMessage: sendMessage,
  sendStreamMessage: sendStreamMessage,
  clearHistory: clearHistory,
  getHistory: getHistory,
  addToHistory: addToHistory,
  getQuickQuestions: getQuickQuestions
}
