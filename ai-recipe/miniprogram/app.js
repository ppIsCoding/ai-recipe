App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用
        //   此处请填入环境 ID, 环境 ID 可登录云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-d5gajbxwu360e66be',
        traceUser: true,
      })
    }

    // 从本地存储加载用户信息
    var userInfo = wx.getStorageSync('userInfo') || null
    this.globalData = {
      userInfo: userInfo,
      preferences: {
        taste: ['清淡', '微辣'],
        avoid: []
      }
    }
    
    console.log('小程序启动成功，用户信息:', userInfo)
  },

  globalData: {
    userInfo: null,
    preferences: {
      taste: ['清淡', '微辣'],
      avoid: []
    }
  }
})
