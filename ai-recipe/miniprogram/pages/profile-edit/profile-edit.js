// 个人信息编辑页面逻辑（云函数版本）
var auth = require('../../utils/auth.js')

Page({
  data: {
    gender: '',
    age: '',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    healthGoal: 'maintain',
    // 选项
    genderOptions: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    activityOptions: [
      { value: 'sedentary', label: '久坐不动', desc: '办公室工作' },
      { value: 'light', label: '轻度活动', desc: '每周1-3次运动' },
      { value: 'moderate', label: '中度活动', desc: '每周3-5次运动' },
      { value: 'active', label: '重度活动', desc: '每周6-7次运动' }
    ],
    goalOptions: [
      { value: 'lose_weight', label: '减脂', icon: '🔥' },
      { value: 'maintain', label: '维持体重', icon: '⚖️' },
      { value: 'gain_muscle', label: '增肌', icon: '💪' }
    ]
  },

  onLoad: function () {
    this.loadUserProfile()
  },

  // 加载用户信息
  loadUserProfile: function () {
    var that = this
    var userId = auth.getUserId()
    if (!userId) return

    wx.cloud.callFunction({
      name: 'user-profile',
      data: {
        action: 'get',
        openid: userId
      },
      success: function (res) {
        if (res.result && res.result.success && res.result.user) {
          var user = res.result.user
          that.setData({
            gender: user.gender || '',
            age: user.age ? String(user.age) : '',
            height: user.height ? String(user.height) : '',
            weight: user.weight ? String(user.weight) : '',
            activityLevel: user.activity_level || 'sedentary',
            healthGoal: user.health_goal || 'maintain'
          })
        }
      }
    })
  },

  // 选择性别
  selectGender: function (e) {
    this.setData({ gender: e.currentTarget.dataset.value })
  },

  // 输入年龄
  onAgeInput: function (e) {
    this.setData({ age: e.detail.value })
  },

  // 输入身高
  onHeightInput: function (e) {
    this.setData({ height: e.detail.value })
  },

  // 输入体重
  onWeightInput: function (e) {
    this.setData({ weight: e.detail.value })
  },

  // 选择活动量
  selectActivity: function (e) {
    this.setData({ activityLevel: e.currentTarget.dataset.value })
  },

  // 选择健康目标
  selectGoal: function (e) {
    this.setData({ healthGoal: e.currentTarget.dataset.value })
  },

  // 保存个人信息
  saveProfile: function () {
    var that = this
    var userId = auth.getUserId()
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 验证必填项
    if (!that.data.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    if (!that.data.age || parseInt(that.data.age) <= 0) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' })
      return
    }
    if (!that.data.height || parseFloat(that.data.height) <= 0) {
      wx.showToast({ title: '请输入有效身高', icon: 'none' })
      return
    }
    if (!that.data.weight || parseFloat(that.data.weight) <= 0) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    // 保存到云函数
    wx.cloud.callFunction({
      name: 'user-profile',
      data: {
        action: 'updateProfile',
        openid: userId,
        gender: that.data.gender,
        age: parseInt(that.data.age),
        height: parseFloat(that.data.height),
        weight: parseFloat(that.data.weight),
        activity_level: that.data.activityLevel,
        health_goal: that.data.healthGoal
      },
      success: function (res) {
        if (res.result && res.result.success) {
          // 保存健康数据到本地存储（用于用户画像）
          var bmi = 0
          var height = parseFloat(that.data.height) / 100
          var weight = parseFloat(that.data.weight)
          if (height > 0 && weight > 0) {
            bmi = (weight / (height * height)).toFixed(1)
          }
          
          var goalMap = {
            'lose_weight': '减脂',
            'maintain': '维持体重',
            'gain_muscle': '增肌'
          }
          
          wx.setStorageSync('healthData', {
            gender: that.data.gender,
            age: parseInt(that.data.age),
            height: parseFloat(that.data.height),
            weight: parseFloat(that.data.weight),
            activityLevel: that.data.activityLevel,
            healthGoal: goalMap[that.data.healthGoal] || '健康饮食',
            bmi: bmi
          })
          
          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(function () {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})
