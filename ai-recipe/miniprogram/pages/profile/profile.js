// 个人中心页面逻辑（云函数版本）
var app = getApp()
var auth = require('../../utils/auth.js')
var favoritesUtil = require('../../utils/favorites.js')
var historyUtil = require('../../utils/history.js')
var healthUtil = require('../../utils/health.js')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    stats: {
      favoriteCount: 0,
      cookCount: 0
    },
    // BMI相关
    bmi: null,
    bmiStatus: '',
    bmiStatusClass: '',
    targetCalories: 0,
    healthGoal: '',
    healthGoalLabel: '',
    showPreference: false,
    tasteOptions: [
      { name: '清淡', selected: false },
      { name: '微辣', selected: false },
      { name: '中辣', selected: false },
      { name: '重辣', selected: false },
      { name: '酸甜', selected: false },
      { name: '咸鲜', selected: false }
    ],
    avoidOptions: [
      { name: '香菜', selected: false },
      { name: '葱姜蒜', selected: false },
      { name: '海鲜', selected: false },
      { name: '坚果', selected: false },
      { name: '乳制品', selected: false },
      { name: '鸡蛋', selected: false }
    ]
  },

  onLoad: function () {
    this.checkLoginState()
    this.loadPreference()
  },

  onShow: function () {
    this.checkLoginState()
    this.loadHealthAnalysis()
  },

  // 检查登录状态
  checkLoginState: function () {
    var isLoggedIn = auth.isLoggedIn()
    var userInfo = auth.getUserInfo()
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo || {}
    })
    if (isLoggedIn) {
      this.loadStats()
    }
  },

  // 加载统计数据
  loadStats: function () {
    var that = this

    // 获取收藏数量
    favoritesUtil.getFavorites().then(function (favorites) {
      that.setData({ 'stats.favoriteCount': favorites.length })
    })

    // 获取做菜历史数量
    historyUtil.getHistory().then(function (history) {
      that.setData({ 'stats.cookCount': history.length })
    })
  },

  // 加载健康分析
  loadHealthAnalysis: function () {
    var that = this
    if (!auth.isLoggedIn()) return

    healthUtil.getHealthAnalysis().then(function (result) {
      if (result.success && result.analysis) {
        var analysis = result.analysis
        var bmiStatusClass = ''
        
        if (analysis.bmi_status_en === 'underweight') {
          bmiStatusClass = 'underweight'
        } else if (analysis.bmi_status_en === 'normal') {
          bmiStatusClass = 'normal'
        } else if (analysis.bmi_status_en === 'overweight') {
          bmiStatusClass = 'overweight'
        } else if (analysis.bmi_status_en === 'obese') {
          bmiStatusClass = 'obese'
        }

        // 健康目标映射
        var goalMap = {
          'lose_weight': '减脂',
          'maintain': '维持体重',
          'gain_muscle': '增肌'
        }

        that.setData({
          bmi: analysis.bmi,
          bmiStatus: analysis.bmi_status,
          bmiStatusClass: bmiStatusClass,
          targetCalories: analysis.target_calories || 0,
          healthGoal: analysis.health_goal || 'maintain',
          healthGoalLabel: goalMap[analysis.health_goal] || '健康饮食'
        })
      } else {
        // 未填写个人信息
        that.setData({
          bmi: null,
          bmiStatus: '',
          bmiStatusClass: '',
          targetCalories: 0
        })
      }
    }).catch(function () {
      // 未填写个人信息
      that.setData({
        bmi: null,
        bmiStatus: '',
        bmiStatusClass: '',
        targetCalories: 0
      })
    })
  },

  // 加载偏好设置
  loadPreference: function () {
    var that = this
    var preference = wx.getStorageSync('preference') || {}
    var taste = preference.taste || []
    var avoid = preference.avoid || []
    
    var tasteOptions = []
    for (var i = 0; i < that.data.tasteOptions.length; i++) {
      var item = that.data.tasteOptions[i]
      var selected = taste.indexOf(item.name) !== -1
      tasteOptions.push({ name: item.name, selected: selected })
    }
    
    var avoidOptions = []
    for (var i = 0; i < that.data.avoidOptions.length; i++) {
      var item = that.data.avoidOptions[i]
      var selected = avoid.indexOf(item.name) !== -1
      avoidOptions.push({ name: item.name, selected: selected })
    }

    that.setData({ tasteOptions: tasteOptions, avoidOptions: avoidOptions })
  },

  // 登录
  login: function () {
    var that = this

    auth.wxLogin().then(function (user) {
      that.setData({
        userInfo: auth.getUserInfo(),
        isLoggedIn: true
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
      that.loadStats()
      that.loadHealthAnalysis()
    }).catch(function (err) {
      console.error('登录失败:', err)
      if (err.message === '需要授权才能登录') {
        wx.showToast({ title: '需要授权才能登录', icon: 'none' })
      } else {
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  },

  // 退出登录
  logout: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          auth.logout()
          that.setData({
            userInfo: {},
            isLoggedIn: false,
            stats: { favoriteCount: 0, cookCount: 0 },
            bmi: null,
            bmiStatus: '',
            targetCalories: 0
          })
          wx.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  },

  // 跳转到个人信息编辑
  goToProfileEdit: function () {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  },

  // 跳转到健康分析
  goToHealthAnalysis: function () {
    wx.navigateTo({ url: '/pages/health-analysis/health-analysis' })
  },

  // 跳转到收藏页面
  goToFavorite: function () {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  // 跳转到历史记录
  goToHistory: function () {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  // 显示偏好设置
  goToPreference: function () {
    this.setData({ showPreference: true })
  },

  // 关闭偏好设置
  closePreference: function () {
    this.setData({ showPreference: false })
  },

  // 阻止弹窗内容点击冒泡
  preventClose: function () {},

  // 切换口味偏好
  toggleTaste: function (e) {
    var index = e.currentTarget.dataset.index
    var key = 'tasteOptions[' + index + '].selected'
    this.setData({ [key]: !this.data.tasteOptions[index].selected })
  },

  // 切换忌口设置
  toggleAvoid: function (e) {
    var index = e.currentTarget.dataset.index
    var key = 'avoidOptions[' + index + '].selected'
    this.setData({ [key]: !this.data.avoidOptions[index].selected })
  },

  // 保存偏好设置
  savePreference: function () {
    var taste = []
    for (var i = 0; i < this.data.tasteOptions.length; i++) {
      if (this.data.tasteOptions[i].selected) taste.push(this.data.tasteOptions[i].name)
    }
    var avoid = []
    for (var i = 0; i < this.data.avoidOptions.length; i++) {
      if (this.data.avoidOptions[i].selected) avoid.push(this.data.avoidOptions[i].name)
    }

    wx.setStorageSync('preference', { taste: taste, avoid: avoid })
    app.globalData.preferences = { taste: taste, avoid: avoid }

    wx.showToast({ title: '保存成功', icon: 'success' })
    this.setData({ showPreference: false })
  },

  // 清除缓存
  clearCache: function () {
    var that = this
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有缓存数据吗？',
      success: function (res) {
        if (res.confirm) {
          wx.clearStorageSync()
          that.setData({ stats: { favoriteCount: 0, cookCount: 0 } })
          wx.showToast({ title: '清除成功', icon: 'success' })
        }
      }
    })
  },

  // 关于我们
  goToAbout: function () {
    wx.showModal({
      title: '关于我们',
      content: '快手小厨 v1.0.0\n\n基于《中国居民膳食指南2022》\n为职场人士提供健康菜谱推荐\n\n今晚吃什么？快手小厨来帮你！',
      showCancel: false
    })
  }
})
