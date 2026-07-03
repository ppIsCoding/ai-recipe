// 拍照识别页面逻辑
var baiduAI = require('../../utils/baidu-ai.js')

Page({
  data: {
    showCamera: true,
    tempImagePath: '',
    isRecognizing: false
  },

  onLoad: function () {
    this.checkCameraPermission()
  },

  // 检查相机权限
  checkCameraPermission: function () {
    var that = this
    wx.authorize({
      scope: 'scope.camera',
      success: function () {
        that.setData({ showCamera: true })
      },
      fail: function () {
        that.setData({ showCamera: false })
        wx.showModal({
          title: '提示',
          content: '需要相机权限才能拍照识别，请在设置中开启',
          confirmText: '去设置',
          success: function (res) {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      }
    })
  },

  // 拍照
  takePhoto: function () {
    var that = this
    var ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: function (res) {
        that.setData({
          tempImagePath: res.tempImagePath,
          showCamera: false
        })
      },
      fail: function (err) {
        console.error('拍照失败:', err)
        wx.showToast({ title: '拍照失败', icon: 'none' })
      }
    })
  },

  // 从相册选择
  chooseFromAlbum: function () {
    var that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        that.setData({
          tempImagePath: res.tempFiles[0].tempFilePath,
          showCamera: false
        })
      }
    })
  },

  // 重新拍照
  retakePhoto: function () {
    this.setData({ tempImagePath: '', showCamera: true })
  },

  // 将图片转为base64（兼容 http://tmp/ 路径）
  getImageBase64: function (filePath) {
    return new Promise(function (resolve, reject) {
      // 如果是 http://tmp/ 开头，需要先下载到本地
      if (filePath.indexOf('http://tmp/') === 0) {
        wx.downloadFile({
          url: filePath,
          success: function (res) {
            if (res.statusCode === 200) {
              wx.getFileSystemManager().readFile({
                filePath: res.tempFilePath,
                encoding: 'base64',
                success: function (data) { resolve(data.data) },
                fail: function (err) { reject(err) }
              })
            } else {
              reject(new Error('下载图片失败'))
            }
          },
          fail: function (err) { reject(err) }
        })
      } else {
        // 本地路径直接读取
        wx.getFileSystemManager().readFile({
          filePath: filePath,
          encoding: 'base64',
          success: function (data) { resolve(data.data) },
          fail: function (err) { reject(err) }
        })
      }
    })
  },

  // 开始识别
  startRecognize: function () {
    var that = this
    if (that.data.isRecognizing) return

    that.setData({ isRecognizing: true })

    wx.showLoading({ title: 'AI识别中...', mask: true })

    that.getImageBase64(that.data.tempImagePath).then(function (base64) {
      return baiduAI.recognizeFood(base64)
    }).then(function (result) {
      wx.hideLoading()
      that.setData({ isRecognizing: false })

      if (result.success && result.foods.length > 0) {
        var foodsParam = encodeURIComponent(JSON.stringify(result.foods))
        var imageParam = encodeURIComponent(that.data.tempImagePath)
        wx.navigateTo({
          url: '/pages/result/result?foods=' + foodsParam + '&image=' + imageParam
        })
      } else {
        wx.showModal({
          title: '识别结果',
          content: '未识别到食材，请重新拍照或手动输入',
          showCancel: true,
          cancelText: '重拍',
          confirmText: '去首页',
          success: function (res) {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/index/index' })
            }
          }
        })
      }
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ isRecognizing: false })
      console.error('识别失败:', err)
      wx.showToast({ title: '识别失败，请重试', icon: 'none' })
    })
  },

  // 相机错误处理
  onCameraError: function (e) {
    console.error('相机错误:', e)
    this.setData({ showCamera: false })
    wx.showToast({ title: '相机打开失败', icon: 'none' })
  }
})
