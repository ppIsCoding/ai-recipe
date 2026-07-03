/**
 * 健康分析工具（云函数版本）
 */

/**
 * 获取健康分析
 * @returns {Promise<Object>} 健康分析结果
 */
function getHealthAnalysis() {
  var auth = require('./auth.js')
  var userId = auth.getUserId()
  
  if (!userId) {
    return Promise.reject(new Error('请先登录'))
  }
  
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'health-analysis',
      data: {
        openid: userId
      },
      success: function (res) {
        if (res.result && res.result.success) {
          resolve({
            success: true,
            analysis: res.result.analysis
          })
        } else {
          reject(new Error(res.result ? res.result.message : '分析失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  getHealthAnalysis: getHealthAnalysis
}
