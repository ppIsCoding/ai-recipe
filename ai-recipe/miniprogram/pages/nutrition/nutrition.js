// 营养分析页面逻辑（云函数版本）

Page({
  data: {
    foods: [],
    nutritionFoods: [],
    total: {},
    healthAdvice: '',
    recommendedRecipes: [],
    loading: true
  },

  onLoad: function (options) {
    if (options.foods) {
      try {
        var foods = JSON.parse(decodeURIComponent(options.foods))
        this.setData({ foods: foods })
        this.analyzeNutrition(foods)
      } catch (e) {
        wx.showToast({ title: '参数错误', icon: 'none' })
      }
    }
  },

  // 调用营养分析云函数
  analyzeNutrition: function (foods) {
    var that = this
    that.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'nutrition-analyze',
      data: {
        foods: foods,
        user_id: 'default'
      },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({
            nutritionFoods: res.result.foods || [],
            total: res.result.total || {},
            healthAdvice: res.result.health_advice || '',
            recommendedRecipes: res.result.recommended_recipes || [],
            loading: false
          })
        } else {
          wx.showToast({ title: '分析失败', icon: 'none' })
          that.setData({ loading: false })
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
        that.setData({ loading: false })
      }
    })
  },

  // 返回
  goBack: function () {
    wx.navigateBack()
  }
})
