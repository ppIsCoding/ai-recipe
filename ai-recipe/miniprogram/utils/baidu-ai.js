/**
 * 食材识别工具函数（云函数版本）
 * 调用云函数进行食材识别
 */

var auth = require('./auth.js')

/**
 * 图像识别 - 调用云函数
 * @param {string} imageBase64 - 图片base64编码
 * @returns {Promise<Object>} 识别结果
 */
function recognizeFood(imageBase64) {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'recognize-food',
      data: {
        image_base64: imageBase64,
        user_id: auth.getUserId() || 'default'
      },
      success: function (res) {
        console.log('云函数识别返回:', JSON.stringify(res.result))
        
        if (res.result && res.result.success) {
          var foods = []
          var items = res.result.foods || []
          for (var i = 0; i < items.length; i++) {
            var item = items[i]
            foods.push({
              name: item.name,
              category: item.category || '其他',
              shelf_life_days: item.shelf_life_days || 3,
              probability: item.probability || 0.9,
              source: 'ai'
            })
          }
          
          resolve({
            success: true,
            foods: foods,
            count: foods.length
          })
        } else {
          resolve({
            success: false,
            foods: [],
            count: 0,
            error: res.result ? res.result.error : '识别失败'
          })
        }
      },
      fail: function (err) {
        console.error('识别云函数调用失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 分析单个食材（本地预测）
 * @param {string} foodName - 食材名称
 * @returns {Promise<Object>} 分析结果
 */
function analyzeSingleFood(foodName) {
  return new Promise(function (resolve) {
    resolve(getLocalPrediction(foodName))
  })
}

/**
 * 本地预测（降级方案）
 */
function getLocalPrediction(foodName) {
  var categoryMap = {
    '番茄': '蔬菜', '西红柿': '蔬菜', '土豆': '蔬菜', '黄瓜': '蔬菜',
    '白菜': '蔬菜', '青椒': '蔬菜', '茄子': '蔬菜', '萝卜': '蔬菜',
    '苹果': '水果', '香蕉': '水果', '橙子': '水果', '葡萄': '水果',
    '猪肉': '肉类', '牛肉': '肉类', '鸡肉': '肉类', '羊肉': '肉类',
    '鱼': '海鲜', '虾': '海鲜', '螃蟹': '海鲜', '贝': '海鲜',
    '鸡蛋': '蛋奶', '牛奶': '蛋奶', '酸奶': '蛋奶', '奶酪': '蛋奶',
    '米饭': '主食', '面条': '主食', '馒头': '主食', '面包': '主食',
    '盐': '调料', '酱油': '调料', '醋': '调料', '糖': '调料'
  }

  var shelfLifeMap = {
    '酸菜': 180, '泡菜': 90, '咸菜': 120, '榨菜': 180,
    '腊肉': 90, '腊肠': 60, '火腿': 30, '香肠': 15,
    '豆腐乳': 180, '豆瓣酱': 180, '辣椒酱': 90, '果酱': 60,
    '蜂蜜': 365, '干木耳': 180, '干香菇': 180, '海带': 180,
    '粉丝': 180, '粉条': 180, '挂面': 180, '方便面': 180,
    '罐头': 365, '饼干': 90, '薯片': 60, '坚果': 90,
    '冷冻肉': 90, '冻鱼': 90, '冰淇淋': 60,
  }

  var categoryShelfLife = {
    '蔬菜': 5, '水果': 7, '肉类': 3, '海鲜': 2,
    '蛋奶': 14, '主食': 30, '调料': 180, '其他': 7
  }

  var category = '其他'
  for (var key in categoryMap) {
    if (foodName.indexOf(key) !== -1 || key.indexOf(foodName) !== -1) {
      category = categoryMap[key]
      break
    }
  }

  var shelfLife = shelfLifeMap[foodName] || categoryShelfLife[category] || 7

  return {
    name: foodName,
    category: category,
    shelf_life_days: shelfLife
  }
}

/**
 * 获取分类图标
 */
function getCategoryIcon(category) {
  var iconMap = {
    '蔬菜': '🥬',
    '水果': '🍎',
    '肉类': '🥩',
    '海鲜': '🐟',
    '蛋奶': '🥚',
    '主食': '🍚',
    '调料': '🧂',
    '其他': '📦'
  }
  return iconMap[category] || '📦'
}

module.exports = {
  recognizeFood: recognizeFood,
  analyzeSingleFood: analyzeSingleFood,
  getCategoryIcon: getCategoryIcon
}
