// 健康分析页面逻辑（云函数版本）
var auth = require('../../utils/auth.js')
var healthUtil = require('../../utils/health.js')

Page({
  data: {
    loading: true,
    hasData: false,
    // BMI数据
    bmi: 0,
    bmiStatus: '',
    bmiStatusClass: '',
    // 代谢数据
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    // 营养目标
    proteinTarget: '',
    fatTarget: '',
    carbsTarget: '',
    // 健康建议
    healthAdvice: [],
    dietaryGuideTips: []
  },

  onLoad: function () {
    this.loadHealthAnalysis()
  },

  onShow: function () {
    this.loadHealthAnalysis()
  },

  // 加载健康分析
  loadHealthAnalysis: function () {
    var that = this
    var userId = auth.getUserId()
    if (!userId) {
      that.setData({ loading: false, hasData: false })
      return
    }

    that.setData({ loading: true })

    healthUtil.getHealthAnalysis().then(function (result) {
      that.setData({ loading: false })
      
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

        that.setData({
          hasData: true,
          bmi: analysis.bmi,
          bmiStatus: analysis.bmi_status,
          bmiStatusClass: bmiStatusClass,
          bmr: analysis.bmr,
          tdee: analysis.tdee,
          targetCalories: analysis.target_calories,
          proteinTarget: analysis.protein_target,
          fatTarget: analysis.fat_target,
          carbsTarget: analysis.carbs_target,
          healthAdvice: analysis.health_advice || [],
          dietaryGuideTips: analysis.dietary_guide_tips || []
        })
      } else {
        that.setData({ hasData: false })
      }
    }).catch(function () {
      that.setData({ loading: false, hasData: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 跳转到个人信息编辑
  goToProfileEdit: function () {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  },

  // 返回
  goBack: function () {
    wx.navigateBack()
  }
})
