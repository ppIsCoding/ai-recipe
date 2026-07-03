/**
 * 做菜历史管理工具（云函数版本）
 */

/**
 * 添加做菜记录
 * @param {Object} record - 记录信息
 * @returns {Promise<Object>} 操作结果
 */
function addHistory(record) {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.reject(new Error('请先登录'))
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'cook-history',
      data: {
        action: 'add',
        user_id: userId,
        recipe_id: record.recipe_id,
        recipe_name: record.recipe_name || '',
        cook_time: record.cook_time || 0,
        rating: record.rating || 5,
        note: record.note || ''
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result)
        } else {
          reject(new Error(res.result ? res.result.message : '添加失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

/**
 * 获取历史列表
 * @returns {Promise<Array>} 历史记录列表
 */
function getHistory() {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.resolve([])
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'cook-history',
      data: {
        action: 'list',
        user_id: userId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result.history || [])
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

/**
 * 删除历史记录
 * @param {string} recordId - 记录ID
 * @returns {Promise<Object>} 操作结果
 */
function deleteHistory(recordId) {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'cook-history',
      data: {
        action: 'delete',
        record_id: recordId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve(res.result)
        } else {
          reject(new Error(res.result ? res.result.message : '删除失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  addHistory: addHistory,
  getHistory: getHistory,
  deleteHistory: deleteHistory
}
