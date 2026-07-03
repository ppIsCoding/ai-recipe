// 做菜历史页面逻辑（云函数版本）
var auth = require('../../utils/auth.js')
var historyUtil = require('../../utils/history.js')

Page({
  data: {
    history: [],
    loading: true,
    isLoggedIn: false
  },

  onLoad: function () {
    if (!auth.requireLogin('做菜历史')) return
    this.setData({ isLoggedIn: true })
    this.loadHistory()
  },

  onShow: function () {
    if (!this.data.isLoggedIn) return
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory: function () {
    var that = this
    that.setData({ loading: true })

    historyUtil.getHistory().then(function (history) {
      that.setData({
        history: history,
        loading: false
      })
    }).catch(function () {
      that.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 跳转到菜谱详情
  goToRecipe: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/recipe/recipe?id=' + id })
  },

  // 删除记录
  deleteRecord: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要删除这条记录吗？',
      success: function (res) {
        if (res.confirm) {
          historyUtil.deleteHistory(id).then(function () {
            wx.showToast({ title: '已删除', icon: 'success' })
            that.loadHistory()
          })
        }
      }
    })
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack()
  }
})
