/**
 * AI对话工具（云函数版本）
 */

/**
 * 发送消息给AI
 * @param {string} message - 用户消息
 * @param {Array} chatHistory - 聊天历史
 * @returns {Promise<Object>} AI回复
 */
function sendMessage(message, chatHistory) {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'ai-chat',
      data: {
        message: message,
        user_id: userId || 'default',
        chat_history: chatHistory || []
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve({
            success: true,
            reply: res.result.reply,
            intent: res.result.intent
          })
        } else {
          reject(new Error(res.result ? res.result.reply : '对话失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  sendMessage: sendMessage
}
