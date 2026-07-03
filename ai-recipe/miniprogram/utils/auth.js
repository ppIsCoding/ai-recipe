/**
 * 登录状态管理工具（云函数版本）
 */

var app = getApp()

/**
 * 获取用户偏好
 * @returns {Object} 用户偏好设置
 */
function getUserPreferences() {
  try {
    if (app && app.globalData && app.globalData.preferences) {
      return app.globalData.preferences
    }
    return {}
  } catch (e) {
    return {}
  }
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!wx.getStorageSync('userId')
}

/**
 * 获取当前用户ID (openid)
 * @returns {string}
 */
function getUserId() {
  return wx.getStorageSync('userId') || ''
}

/**
 * 获取用户信息
 * @returns {object}
 */
function getUserInfo() {
  var userInfo = wx.getStorageSync('userInfo') || {}
  console.log('从本地存储获取用户信息:', userInfo)
  return userInfo
}

/**
 * 微信登录（云函数版本）
 * @returns {Promise}
 */
function wxLogin() {
  return new Promise(function (resolve, reject) {
    // 第一步：弹出授权窗口获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: function (profileRes) {
        var userInfo = profileRes.userInfo
        console.log('获取到用户信息:', userInfo)

        // 第二步：获取 code
        wx.login({
          success: function (loginRes) {
            if (loginRes.code) {
              // 第三步：调用云函数登录
              wx.cloud.callFunction({
                name: 'user-login',
                data: {
                  code: loginRes.code,
                  nickname: userInfo.nickName || '微信用户',
                  avatar_url: userInfo.avatarUrl || ''
                },
                success: function (res) {
                  console.log('登录响应数据:', res.result)
                  if (res.result && res.result.success) {
                    var user = res.result.user
                    console.log('用户信息:', user)
                    // 构建用户信息对象
                    var userInfoObj = {
                      openid: user.openid,
                      nickname: user.nickname || userInfo.nickName || '微信用户',
                      avatar_url: user.avatar_url || userInfo.avatarUrl || '/images/user.png',
                      taste: user.taste || [],
                      avoid: user.avoid || []
                    }
                    // 保存完整的用户信息
                    wx.setStorageSync('userId', user.openid)
                    wx.setStorageSync('userInfo', userInfoObj)
                    app.globalData.userInfo = userInfoObj
                    console.log('保存后的用户信息:', userInfoObj)
                    resolve(user)
                  } else {
                    reject(new Error(res.result ? res.result.message : '登录失败'))
                  }
                },
                fail: function (err) {
                  console.error('登录云函数调用失败:', err)
                  reject(err)
                }
              })
            } else {
              reject(new Error('获取code失败'))
            }
          },
          fail: function (err) {
            console.error('wx.login失败:', err)
            reject(err)
          }
        })
      },
      fail: function (err) {
        console.error('用户拒绝授权:', err)
        reject(new Error('需要授权才能登录'))
      }
    })
  })
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('userId')
  wx.removeStorageSync('userInfo')
  app.globalData.userInfo = null
}

/**
 * 需要登录的功能检查
 * @param {string} featureName - 功能名称
 * @returns {boolean} true=已登录可继续, false=未登录
 */
function requireLogin(featureName) {
  if (isLoggedIn()) {
    return true
  }

  wx.showModal({
    title: '提示',
    content: '使用' + (featureName || '此功能') + '需要先登录，是否前往登录？',
    confirmText: '去登录',
    cancelText: '取消',
    success: function (res) {
      if (res.confirm) {
        wx.switchTab({
          url: '/pages/profile/profile'
        })
      }
    }
  })

  return false
}

/**
 * 获取用户画像（用于传递给AI）
 * @returns {string} 用户画像文本
 */
function getUserProfile() {
  var userInfo = getUserInfo()
  var preference = wx.getStorageSync('preference') || {}
  
  var parts = []
  
  // 基本信息
  if (userInfo.nickname) {
    parts.push('昵称: ' + userInfo.nickname)
  }
  
  // 口味偏好
  if (preference.taste && preference.taste.length > 0) {
    parts.push('口味偏好: ' + preference.taste.join('、'))
  }
  
  // 忌口
  if (preference.avoid && preference.avoid.length > 0) {
    parts.push('忌口: ' + preference.avoid.join('、'))
  }
  
  // 健康数据（如果有）
  var healthData = wx.getStorageSync('healthData') || {}
  if (healthData.bmi) {
    parts.push('BMI: ' + healthData.bmi)
  }
  if (healthData.healthGoal) {
    parts.push('健康目标: ' + healthData.healthGoal)
  }
  
  return parts.join('；')
}

module.exports = {
  isLoggedIn: isLoggedIn,
  getUserId: getUserId,
  getUserInfo: getUserInfo,
  getUserPreferences: getUserPreferences,
  getUserProfile: getUserProfile,
  wxLogin: wxLogin,
  logout: logout,
  requireLogin: requireLogin
}
