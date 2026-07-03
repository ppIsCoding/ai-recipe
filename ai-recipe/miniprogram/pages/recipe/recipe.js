// 菜谱详情页面逻辑（云函数版本）
var recipeUtil = require('../../utils/recipe.js')
var favoritesUtil = require('../../utils/favorites.js')
var historyUtil = require('../../utils/history.js')
var auth = require('../../utils/auth.js')

Page({
  data: {
    recipe: {},
    isFavorite: false,
    // 营养百分比（基于每日推荐量）
    caloriesPercent: 0,
    proteinPercent: 0,
    fatPercent: 0,
    carbsPercent: 0,
    // 做菜模式
    showCookMode: false,
    currentStep: 0,
    totalSteps: 0,
    currentStepDesc: '',
    isFirstStep: true,
    isLastStep: false,
    // 语音播报
    isSpeaking: false,
    voiceEnabled: true
  },

  onLoad: function (options) {
    var id = parseInt(options.id)
    this.loadRecipeDetail(id)
    this.checkFavorite(id)
    this.initVoicePlugin()
  },

  onUnload: function () {
    this.stopSpeaking()
  },

  // 初始化语音插件
  initVoicePlugin: function () {
    try {
      this.plugin = requirePlugin('WechatSI')
    } catch (e) {
      console.error('微信同声传译插件加载失败', e)
    }
  },

  // 加载菜谱详情
  loadRecipeDetail: function (id) {
    var that = this
    
    // 从云函数获取菜谱详情
    recipeUtil.getRecipeDetailFromServer(id).then(function (recipe) {
      that.setData({
        recipe: recipe,
        totalSteps: recipe.steps ? recipe.steps.length : 0
      })
      that.calcNutritionPercent(recipe)
    }).catch(function (err) {
      console.error('获取菜谱详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 计算营养百分比（基于每日推荐量）
  calcNutritionPercent: function (recipe) {
    var n = recipe.nutrition || {}
    // 每日推荐量参考值
    var dailyCalories = 2000
    var dailyProtein = 80
    var dailyFat = 65
    var dailyCarbs = 250
    this.setData({
      caloriesPercent: Math.min(100, Math.round((n.calories || 0) / dailyCalories * 100)),
      proteinPercent: Math.min(100, Math.round((n.protein || 0) / dailyProtein * 100)),
      fatPercent: Math.min(100, Math.round((n.fat || 0) / dailyFat * 100)),
      carbsPercent: Math.min(100, Math.round((n.carbs || 0) / dailyCarbs * 100))
    })
  },

  // 检查是否已收藏
  checkFavorite: function (id) {
    var that = this
    if (!auth.isLoggedIn()) return

    favoritesUtil.checkFavorite(id).then(function (isFavorite) {
      that.setData({ isFavorite: isFavorite })
    })
  },

  // 切换收藏状态
  toggleFavorite: function () {
    if (!auth.requireLogin('收藏功能')) return
    var that = this
    var id = that.data.recipe.id

    favoritesUtil.toggleFavorite(id).then(function (result) {
      that.setData({ isFavorite: result.is_favorite })
      wx.showToast({ title: result.message, icon: 'success' })
    })
  },

  // 跳转到营养分析页面
  goToNutrition: function () {
    var recipe = this.data.recipe
    var foods = recipe.mainIngredients || []
    if (foods.length === 0) {
      wx.showToast({ title: '暂无食材信息', icon: 'none' })
      return
    }
    var foodsParam = encodeURIComponent(JSON.stringify(foods))
    wx.navigateTo({ url: '/pages/nutrition/nutrition?foods=' + foodsParam })
  },

  // 开始做菜
  startCook: function () {
    if (!auth.requireLogin('做菜功能')) return
    var steps = this.data.recipe.steps || []
    if (steps.length === 0) {
      wx.showToast({ title: '暂无步骤', icon: 'none' })
      return
    }
    this.setData({
      showCookMode: true,
      currentStep: 0,
      currentStepDesc: steps[0].desc,
      isFirstStep: true,
      isLastStep: steps.length === 1
    })
    this.speakStep()
  },

  // 播报当前步骤
  speakStep: function () {
    var that = this
    var steps = that.data.recipe.steps || []
    var current = that.data.currentStep

    if (!that.data.voiceEnabled) return
    if (!that.plugin) return
    if (current >= steps.length) return

    that.stopSpeaking()

    var text = '步骤' + (current + 1) + '，' + steps[current].desc
    if (text.length > 50) {
      text = text.substring(0, 47) + '...'
    }

    that._speakText(text)
  },

  // 底层TTS调用
  _speakText: function (text) {
    var that = this
    var plugin = that.plugin

    plugin.textToSpeech({
      lang: 'zh_CN',
      tts: true,
      content: text,
      success: function (res) {
        if (res.retcode === 0) {
          var audio = wx.createInnerAudioContext()
          audio.src = res.filename
          audio.onPlay(function () {
            that.setData({ isSpeaking: true })
          })
          audio.onEnded(function () {
            that.setData({ isSpeaking: false })
            audio.destroy()
          })
          audio.onError(function () {
            that.setData({ isSpeaking: false })
            audio.destroy()
          })
          audio.play()
          that._audioContext = audio
        }
      },
      fail: function (res) {
        console.error('语音合成失败', res)
      }
    })
  },

  // 停止语音播放
  stopSpeaking: function () {
    if (this._audioContext) {
      try {
        this._audioContext.stop()
        this._audioContext.destroy()
      } catch (e) {}
      this._audioContext = null
    }
    this.setData({ isSpeaking: false })
  },

  // 切换语音开关
  toggleVoice: function () {
    var enabled = !this.data.voiceEnabled
    this.setData({ voiceEnabled: enabled })
    if (!enabled) {
      this.stopSpeaking()
    }
  },

  // 上一步
  prevStep: function () {
    var steps = this.data.recipe.steps || []
    var current = this.data.currentStep
    if (current <= 0) return

    current = current - 1
    this.setData({
      currentStep: current,
      currentStepDesc: steps[current].desc,
      isFirstStep: current === 0,
      isLastStep: current === steps.length - 1
    })
    this.speakStep()
  },

  // 下一步
  nextStep: function () {
    var steps = this.data.recipe.steps || []
    var current = this.data.currentStep
    if (current >= steps.length - 1) return

    current = current + 1
    this.setData({
      currentStep: current,
      currentStepDesc: steps[current].desc,
      isFirstStep: current === 0,
      isLastStep: current === steps.length - 1
    })
    this.speakStep()
  },

  // 完成做菜
  finishCook: function () {
    var that = this
    var recipe = that.data.recipe

    that.stopSpeaking()

    // 记录做菜历史
    historyUtil.addHistory({
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      cook_time: 0,
      rating: 5,
      note: ''
    })

    that.setData({ showCookMode: false })
    wx.showToast({ title: '做菜完成！', icon: 'success' })
  },

  // 关闭做菜模式
  closeCookMode: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定要退出做菜模式吗？',
      success: function (res) {
        if (res.confirm) {
          that.stopSpeaking()
          that.setData({ showCookMode: false })
        }
      }
    })
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: '教你做' + this.data.recipe.name,
      path: '/pages/recipe/recipe?id=' + this.data.recipe.id
    }
  }
})
