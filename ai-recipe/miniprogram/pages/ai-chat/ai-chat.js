// AI助手页面逻辑
var qwenChat = require('../../utils/qwen-chat.js')
var auth = require('../../utils/auth.js')
var markdown = require('../../utils/markdown.js')
var app = getApp()

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    scrollToView: '',
    quickQuestions: [],
    showQuickQuestions: true,
    userAvatar: ''
  },

  onLoad: function () {
    var userInfo = auth.getUserInfo()
    this.setData({
      quickQuestions: qwenChat.getQuickQuestions(),
      userAvatar: userInfo.avatar_url || ''
    })
  },

  onUnload: function () {
    qwenChat.clearHistory()
    if (this._requestTask) {
      this._requestTask.abort()
    }
  },

  // 添加消息
  addMessage: function (role, content) {
    var messages = this.data.messages.slice()
    var messageId = 'msg-' + Date.now()

    var msg = {
      id: messageId,
      role: role,
      content: content
    }

    // AI消息生成HTML
    if (role === 'assistant' && content) {
      msg.htmlContent = markdown.markdownToHtml(content)
    }

    messages.push(msg)

    this.setData({
      messages: messages,
      scrollToView: messageId
    })

    return messageId
  },

  // 更新最后一条AI消息的内容（流式追加）
  appendToLastMessage: function (content) {
    var messages = this.data.messages.slice()
    if (messages.length === 0) return

    var lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'assistant') return

    lastMsg.content += content
    lastMsg.htmlContent = markdown.markdownToHtml(lastMsg.content)

    this.setData({
      messages: messages,
      scrollToView: lastMsg.id
    })
  },

  // 输入变化
  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value })
  },

  // 发送消息（流式）
  sendMessage: function () {
    var that = this
    var message = that.data.inputText.trim()

    if (!message || that.data.isLoading) return

    that.addMessage('user', message)
    that.setData({
      inputText: '',
      isLoading: true,
      showQuickQuestions: false
    })

    var fullReply = ''
    var aiMsgAdded = false

    that._requestTask = qwenChat.sendStreamMessage(message, {
      onIntent: function (intent) {
        console.log('识别意图:', intent)
      },
      onContent: function (content) {
        if (!aiMsgAdded) {
          aiMsgAdded = true
          that.setData({ isLoading: false })
          that.addMessage('assistant', '')
        }
        fullReply += content
        that.appendToLastMessage(content)
      },
      onDone: function () {
        that.setData({ isLoading: false })
        qwenChat.addToHistory(message, fullReply)
        that._requestTask = null
      },
      onError: function (err) {
        console.error('流式对话失败:', err)
        if (!aiMsgAdded) {
          that.setData({ isLoading: false })
          that.addMessage('assistant', '网络开小差了，请检查网络后重试～')
        }
        that._requestTask = null
      }
    })
  },

  // 快捷问题
  sendQuickQuestion: function (e) {
    this.setData({ inputText: e.currentTarget.dataset.text })
    this.sendMessage()
  },

  // 清空对话
  clearChat: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定要清空对话吗？',
      success: function (res) {
        if (res.confirm) {
          qwenChat.clearHistory()
          that.setData({ messages: [], showQuickQuestions: true })
        }
      }
    })
  },

  onConfirm: function () {
    this.sendMessage()
  }
})
