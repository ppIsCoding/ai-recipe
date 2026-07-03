// 首页逻辑 - 今晚吃什么
var recipeUtil = require('../../utils/recipe.js')
var auth = require('../../utils/auth.js')
var fixImageUrl = recipeUtil.fixImageUrl

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    greeting: '晚上好',
    allRecipes: [],
    filteredRecipes: [],
    loading: false,
    // 多选标签（默认选中"轻烹饪"）
    activeTags: ['轻烹饪'],
    activeTimes: [15],
    // 标签选中状态（用于 WXML 绑定）
    tag1Selected: true,
    tag2Selected: false,
    tag3Selected: false,
    tag4Selected: false,
    time15Selected: true,
    time30Selected: false,
    time45Selected: false,
    time60Selected: false,
    // 缓存相关
    lastFetchTime: 0,
    lastFetchTags: '轻烹饪',
    lastFetchTimes: '15'
  },

  // 更新标签选中状态
  updateTagStates: function () {
    var activeTags = this.data.activeTags
    this.setData({
      tag1Selected: activeTags.indexOf('轻烹饪') > -1,
      tag2Selected: activeTags.indexOf('少盐') > -1,
      tag3Selected: activeTags.indexOf('少油') > -1,
      tag4Selected: activeTags.indexOf('高蛋白') > -1
    })
  },

  // 更新时间选中状态
  updateTimeStates: function () {
    var activeTimes = this.data.activeTimes
    this.setData({
      time15Selected: activeTimes.indexOf(15) > -1,
      time30Selected: activeTimes.indexOf(30) > -1,
      time45Selected: activeTimes.indexOf(45) > -1,
      time60Selected: activeTimes.indexOf(60) > -1
    })
  },

  onLoad: function () {
    this.updateGreeting()
    this.getUserInfo()
    this._isFirstLoad = true
  },

  onShow: function () {
    this.updateGreeting()
    this.getUserInfo()
    
    // 只在首次加载时获取推荐，之后使用缓存
    if (this._isFirstLoad && auth.isLoggedIn()) {
      this._isFirstLoad = false
      this.loadRecommendRecipes(false)
    }
  },

  // 根据时间更新问候语
  updateGreeting: function () {
    var hour = new Date().getHours()
    var greeting = '晚上好'
    if (hour >= 6 && hour < 11) greeting = '早上好'
    else if (hour >= 11 && hour < 14) greeting = '中午好'
    else if (hour >= 14 && hour < 18) greeting = '下午好'
    else if (hour >= 18 && hour < 22) greeting = '晚上好'
    else greeting = '夜深了'
    this.setData({ greeting: greeting })
  },

  // 获取用户信息
  getUserInfo: function () {
    var app = getApp()
    this.setData({
      userInfo: app.globalData.userInfo || {},
      isLoggedIn: auth.isLoggedIn()
    })
  },

  // 加载推荐菜谱
  // forceRefresh: 是否强制刷新（忽略缓存）
  loadRecommendRecipes: function (forceRefresh) {
    var that = this
    if (!auth.isLoggedIn()) return

    // 检查缓存（用 slice 创建副本再排序，避免修改原数组）
    var tagsKey = that.data.activeTags.slice().sort().join(',')
    var timesKey = that.data.activeTimes.slice().sort().join(',')
    
    // 如果标签没变且不是强制刷新，使用缓存
    if (!forceRefresh && 
        tagsKey === that.data.lastFetchTags && 
        timesKey === that.data.lastFetchTimes &&
        that.data.allRecipes.length > 0) {
      that.applyFilters()
      return
    }

    that.setData({ loading: true })

    var preference = wx.getStorageSync('preference') || {}
    
    // 计算最大时间
    var maxTime = 30
    if (that.data.activeTimes.length > 0) {
      maxTime = Math.max.apply(null, that.data.activeTimes)
    }
    
    recipeUtil.getRecipeRecommendations([], {
      taste: preference.taste || [],
      avoid: preference.avoid || [],
      maxTime: maxTime,
      filterTags: that.data.activeTags
    }).then(function (result) {
      that.setData({ loading: false })
      
      if (result.success && result.recipes && result.recipes.length > 0) {
        var recipes = []
        for (var i = 0; i < result.recipes.length; i++) {
          var recipe = result.recipes[i]
          recipes.push({
            id: recipe.id,
            name: recipe.name,
            desc: recipe.desc || recipe.cook_time + ' · ' + recipe.difficulty,
            image_url: fixImageUrl(recipe.image_url || recipe.image),
            cook_time: recipe.cook_time || recipe.time,
            difficulty: recipe.difficulty,
            health_tags: recipe.health_tags || [],
            nutrition: recipe.nutrition || {},
            health_score: recipe.health_score || 0
          })
        }
        
        that.setData({
          allRecipes: recipes,
          lastFetchTime: now,
          lastFetchTags: tagsKey,
          lastFetchTimes: timesKey
        })
        that.applyFilters()
      } else {
        that.loadRandomRecipes()
      }
    }).catch(function () {
      that.setData({ loading: false })
      that.loadRandomRecipes()
    })
  },

  // 随机推荐（降级方案）
  loadRandomRecipes: function () {
    var that = this
    recipeUtil.getRecipesFromServer().then(function (allRecipes) {
      var shuffled = allRecipes.sort(function () { return Math.random() - 0.5 })
      var recipes = []
      var count = Math.min(6, shuffled.length)
      
      for (var i = 0; i < count; i++) {
        var recipe = shuffled[i]
        recipes.push({
          id: recipe.id,
          name: recipe.name,
          desc: recipe.desc,
          image_url: fixImageUrl(recipe.image_url || recipe.image),
          cook_time: recipe.cook_time || recipe.time,
          difficulty: recipe.difficulty,
          health_tags: recipe.health_tags || ['轻烹饪'],
          nutrition: recipe.nutrition || {}
        })
      }

      that.setData({
        allRecipes: recipes,
        loading: false
      })
      that.applyFilters()
    })
  },

  // 切换健康标签（多选）
  toggleTag: function (e) {
    var tag = e.currentTarget.dataset.tag
    var activeTags = this.data.activeTags.slice()
    var index = activeTags.indexOf(tag)
    
    if (index > -1) {
      activeTags.splice(index, 1)
    } else {
      activeTags.push(tag)
    }
    
    this.setData({ activeTags: activeTags })
    this.updateTagStates()
    // 切换标签时请求后端
    this.loadRecommendRecipes(false)
  },

  // 切换时间筛选（多选）
  toggleTime: function (e) {
    var time = parseInt(e.currentTarget.dataset.time)
    var activeTimes = this.data.activeTimes.slice()
    var index = activeTimes.indexOf(time)
    
    if (index > -1) {
      activeTimes.splice(index, 1)
    } else {
      activeTimes.push(time)
    }
    
    this.setData({ activeTimes: activeTimes })
    this.updateTimeStates()
    // 切换时间时请求后端
    this.loadRecommendRecipes(false)
  },

  // 应用筛选
  applyFilters: function () {
    var that = this
    var allRecipes = that.data.allRecipes
    var activeTags = that.data.activeTags
    var activeTimes = that.data.activeTimes

    var filtered = allRecipes.filter(function (recipe) {
      // 标签筛选（多选，满足任一标签即可）
      if (activeTags.length > 0) {
        var tags = recipe.health_tags || []
        var hasTag = false
        for (var i = 0; i < activeTags.length; i++) {
          if (tags.indexOf(activeTags[i]) > -1) {
            hasTag = true
            break
          }
        }
        if (!hasTag) return false
      }

      // 时间筛选（多选，满足任一时间即可）
      if (activeTimes.length > 0) {
        var cookTime = recipe.cook_time || ''
        var timeMatch = cookTime.match(/(\d+)/)
        if (timeMatch) {
          var minutes = parseInt(timeMatch[1])
          var matchTime = false
          for (var i = 0; i < activeTimes.length; i++) {
            if (minutes <= activeTimes[i]) {
              matchTime = true
              break
            }
          }
          if (!matchTime) return false
        }
      }

      return true
    })

    that.setData({ filteredRecipes: filtered })
  },

  // 刷新推荐菜谱（强制刷新）
  refreshRecipes: function () {
    var that = this
    wx.showToast({ title: '正在刷新...', icon: 'loading' })
    that.loadRecommendRecipes(true)
    setTimeout(function () {
      wx.showToast({ title: '已刷新', icon: 'success' })
    }, 500)
  },

  // 跳转到拍照页面
  goToCamera: function () {
    wx.navigateTo({ url: '/pages/camera/camera' })
  },

  // 跳转到菜谱详情
  goToRecipe: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/recipe/recipe?id=' + id })
  },

  // 跳转到个人中心
  goToProfile: function () {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: '快手小厨 - 基于膳食指南的健康菜谱推荐',
      path: '/pages/index/index'
    }
  }
})
