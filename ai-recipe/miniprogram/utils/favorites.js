/**
 * 收藏管理工具（云函数版本）
 */

/**
 * 切换收藏状态
 * @param {number} recipeId - 菜谱ID
 * @returns {Promise<Object>} 操作结果
 */
function toggleFavorite(recipeId) {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.reject(new Error('请先登录'))
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'favorites',
      data: {
        action: 'toggle',
        user_id: userId,
        recipe_id: recipeId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result)
        } else {
          reject(new Error(res.result ? res.result.message : '操作失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

/**
 * 检查是否已收藏
 * @param {number} recipeId - 菜谱ID
 * @returns {Promise<boolean>} 是否已收藏
 */
function checkFavorite(recipeId) {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.resolve(false)
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'favorites',
      data: {
        action: 'check',
        user_id: userId,
        recipe_id: recipeId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result.is_favorite)
        } else {
          resolve(false)
        }
      },
      fail: function () {
        resolve(false)
      }
    })
  })
}

/**
 * 获取收藏列表
 * @returns {Promise<Array>} 收藏的菜谱列表
 */
function getFavorites() {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.resolve([])
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'favorites',
      data: {
        action: 'list',
        user_id: userId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result.favorites || [])
        } else {
          resolve([])
        }
      },
      fail: function () {
        resolve([])
      }
    })
  })
}

module.exports = {
  toggleFavorite: toggleFavorite,
  checkFavorite: checkFavorite,
  getFavorites: getFavorites
}
