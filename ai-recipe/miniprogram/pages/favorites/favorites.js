// 收藏列表页面逻辑（云函数版本）
var auth = require('../../utils/auth.js')
var favoritesUtil = require('../../utils/favorites.js')
var recipeUtil = require('../../utils/recipe.js')
var fixImageUrl = recipeUtil.fixImageUrl

Page({
  data: {
    favorites: [],
    loading: true,
    isLoggedIn: false
  },

  onLoad: function () {
    if (!auth.requireLogin('收藏功能')) return
    this.setData({ isLoggedIn: true })
    this.loadFavorites()
  },

  onShow: function () {
    if (!this.data.isLoggedIn) return
    this.loadFavorites()
  },

  // 加载收藏列表
  loadFavorites: function () {
    var that = this
    that.setData({ loading: true })

    favoritesUtil.getFavorites().then(function (favorites) {
      // 格式化菜谱数据
      var formattedFavorites = favorites.map(function (r) {
        return {
          id: r.id,
          name: r.name,
          image: fixImageUrl(r.image_url),
          desc: r.description || r.difficulty + ' · ' + r.cook_time,
          time: r.cook_time,
          difficulty: r.difficulty
        }
      })

      that.setData({ favorites: formattedFavorites, loading: false })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  // 跳转到菜谱详情
  goToRecipe: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/recipe/recipe?id=' + id })
  },

  // 取消收藏
  removeFavorite: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: function (res) {
        if (res.confirm) {
          favoritesUtil.toggleFavorite(id).then(function () {
            wx.showToast({ title: '已取消收藏', icon: 'success' })
            that.loadFavorites()
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
