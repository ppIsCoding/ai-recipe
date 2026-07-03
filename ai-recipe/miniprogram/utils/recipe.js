// 菜谱推荐工具（云函数版本）
// 调用云函数进行智能推荐

var auth = require('./auth.js')

/**
 * 修复图片URL - 统一处理jsDelivr CDN地址
 * @param {string} url - 原始图片URL
 * @returns {string} 修复后的URL
 */
function fixImageUrl(url) {
  if (!url) return '/images/recipe/番茄炒蛋.png'
  
  // 如果是jsDelivr CDN地址但没有@main，添加@main
  if (url.indexOf('cdn.jsdelivr.net/gh/ppIsCoding/img/') > -1 && url.indexOf('@main') === -1) {
    url = url.replace('ppIsCoding/img/', 'ppIsCoding/img@main/')
  }
  
  return url
}

/**
 * 格式化菜谱数据为前端需要的格式
 * @param {Object} r - 菜谱对象
 * @param {Object} options - 可选配置
 * @returns {Object} 格式化后的菜谱对象
 */
function formatRecipe(r, options) {
  options = options || {}
  var result = {
    id: r.id,
    name: r.name,
    image: fixImageUrl(r.image_url),
    desc: r.description || r.difficulty + ' · ' + r.cook_time,
    time: r.cook_time,
    difficulty: r.difficulty,
    mainIngredients: r.main_ingredients || [],
    nutrition: r.nutrition || {},
    category: r.category,
    health_tags: r.health_tags || [],
    health_score: r.health_score || 0
  }
  
  if (options.includeDetails) {
    result.servings = r.servings
    result.ingredients = r.ingredients || []
    result.steps = r.steps || []
  }
  
  if (options.match !== undefined) {
    result.match = options.match
  }
  
  return result
}

/**
 * 从云函数获取单个菜谱详情
 * @param {number} id - 菜谱ID
 * @returns {Promise<Object>} 菜谱详情
 */
function getRecipeDetailFromServer(id) {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'get-recipes',
      data: {
        action: 'detail',
        recipe_id: id
      },
      success: function (res) {
        if (res.result && res.result.success && res.result.recipe) {
          resolve(formatRecipe(res.result.recipe, { includeDetails: true }))
        } else {
          reject(new Error('获取菜谱详情失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

/**
 * 从云函数获取菜谱列表
 * @param {string} category - 分类筛选（可选）
 * @returns {Promise<Array>} 菜谱列表
 */
function getRecipesFromServer(category) {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'get-recipes',
      data: {
        action: 'list',
        category: category || ''
      },
      success: function (res) {
        if (res.result && res.result.success) {
          var recipes = res.result.recipes || []
          var formattedRecipes = []
          for (var i = 0; i < recipes.length; i++) {
            formattedRecipes.push(formatRecipe(recipes[i], { includeDetails: true }))
          }
          resolve(formattedRecipes)
        } else {
          reject(new Error('获取菜谱列表失败'))
        }
      },
      fail: function (err) {
        reject(err)
      }
    })
  })
}

/**
 * 获取菜谱推荐 - 调用云函数
 * @param {Array} foods - 食材列表
 * @param {Object} options - 推荐选项
 * @returns {Promise<Object>} 推荐结果
 */
function getRecipeRecommendations(foods, options) {
  return new Promise(function (resolve, reject) {
    var foodNames = []
    if (foods && foods.length > 0) {
      for (var i = 0; i < foods.length; i++) {
        foodNames.push(foods[i].name || foods[i])
      }
    }
    
    options = options || {}
    var preferences = auth.getUserPreferences() || {}
    
    // 合并传入的选项
    if (options.taste) {
      preferences.taste = options.taste
    }
    if (options.avoid) {
      preferences.avoid = options.avoid
    }
    
    // 获取用户健康档案
    var healthData = wx.getStorageSync('healthData') || {}
    var userProfile = {
      bmi: healthData.bmi ? parseFloat(healthData.bmi) : null,
      health_goal: healthData.healthGoal || 'maintain'
    }
    
    wx.cloud.callFunction({
      name: 'recipe-recommend',
      data: {
        user_id: auth.getUserId() || 'default',
        foods: foodNames,
        user_preferences: preferences,
        user_profile: userProfile,
        max_time: options.maxTime || 30,
        filter_tags: options.filterTags || []
      },
      success: function (res) {
        console.log('云函数推荐返回:', JSON.stringify(res.result))
        
        if (res.result && res.result.success) {
          var recipes = res.result.recipes || []
          var results = []
          for (var i = 0; i < recipes.length; i++) {
            var r = recipes[i]
            results.push(formatRecipe(r, { match: r.health_score || 80 }))
          }
          resolve({
            success: true,
            recipes: results,
            message: res.result.recommendations || ''
          })
        } else {
          resolve({
            success: false,
            recipes: [],
            message: '推荐失败'
          })
        }
      },
      fail: function (err) {
        console.error('推荐云函数调用失败:', err)
        reject(err)
      }
    })
  })
}

module.exports = {
  getRecipeRecommendations: getRecipeRecommendations,
  getRecipesFromServer: getRecipesFromServer,
  getRecipeDetailFromServer: getRecipeDetailFromServer,
  fixImageUrl: fixImageUrl
}
