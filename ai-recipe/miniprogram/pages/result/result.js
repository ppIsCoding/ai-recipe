// 识别结果页面逻辑
var recipeUtil = require('../../utils/recipe.js')
var baiduAI = require('../../utils/baidu-ai.js')

Page({
  data: {
    foods: [],
    imagePath: '',
    recipes: [],
    showRecipePopup: false,
    hasRecipes: false,
    recommendMessage: ''
  },

  onLoad: function (options) {
    var that = this
    if (options.foods) {
      try {
        var foods = JSON.parse(decodeURIComponent(options.foods))
        var processedFoods = []
        for (var i = 0; i < foods.length; i++) {
          var food = foods[i]
          if (food.name) {
            processedFoods.push({
              name: food.name,
              category: food.category || '其他',
              categoryIcon: baiduAI.getCategoryIcon(food.category || '其他'),
              shelf_life_days: food.shelf_life_days || 3,
              probability: food.probability,
              probabilityText: (food.probability * 100).toFixed(0) + '%',
              checked: true,
              predicting: true
            })
          }
        }
        that.setData({
          foods: processedFoods,
          imagePath: decodeURIComponent(options.image || '')
        })

        // AI预测每个食材的分类和保质期
        that.predictAllFoods(processedFoods)

      } catch (err) {
        console.error('解析食材数据失败:', err)
        wx.showToast({
          title: '数据错误',
          icon: 'none'
        })
      }
    }
  },

  // AI预测所有食材
  predictAllFoods: function (foods) {
    var that = this
    var promises = []

    for (var i = 0; i < foods.length; i++) {
      (function (index) {
        var promise = new Promise(function (resolve) {
          baiduAI.analyzeSingleFood(foods[index].name).then(function (result) {
            if (result) {
              resolve({ index: index, result: result })
            } else {
              resolve(null)
            }
          }).catch(function () {
            resolve(null)
          })
        })
        promises.push(promise)
      })(i)
    }

    Promise.all(promises).then(function (results) {
      var updatedFoods = that.data.foods.slice()
      for (var i = 0; i < results.length; i++) {
        var item = results[i]
        if (item && item.result) {
          updatedFoods[item.index] = {
            name: item.result.name || updatedFoods[item.index].name,
            category: item.result.category || updatedFoods[item.index].category,
            categoryIcon: baiduAI.getCategoryIcon(item.result.category || updatedFoods[item.index].category),
            shelf_life_days: item.result.shelf_life_days || updatedFoods[item.index].shelf_life_days,
            probability: updatedFoods[item.index].probability,
            probabilityText: updatedFoods[item.index].probabilityText,
            checked: true,
            predicting: false
          }
        } else {
          updatedFoods[item.index].predicting = false
        }
      }
      that.setData({ foods: updatedFoods })
    })
  },

  // 切换食材选中状态
  toggleFood: function (e) {
    var index = e.currentTarget.dataset.index
    var data = {}
    data['foods[' + index + '].checked'] = !this.data.foods[index].checked
    this.setData(data)
  },

  // 手动添加食材
  addManual: function () {
    var that = this
    wx.showModal({
      title: '添加食材',
      editable: true,
      placeholderText: '请输入食材名称',
      success: function (res) {
        if (res.confirm && res.content) {
          var foodName = res.content.trim()
          // 先用默认值，然后AI预测
          var newFood = {
            name: foodName,
            category: '其他',
            categoryIcon: '📦',
            shelf_life_days: 7,
            probability: 1,
            probabilityText: '100%',
            checked: true,
            predicting: true
          }
          var foods = that.data.foods.concat([newFood])
          that.setData({ foods: foods })

          // AI预测
          baiduAI.analyzeSingleFood(foodName).then(function (result) {
            if (result) {
              var index = that.data.foods.length - 1
              var data = {}
              data['foods[' + index + '].category'] = result.category || '其他'
              data['foods[' + index + '].categoryIcon'] = baiduAI.getCategoryIcon(result.category || '其他')
              data['foods[' + index + '].shelf_life_days'] = result.shelf_life_days || 7
              data['foods[' + index + '].predicting'] = false
              that.setData(data)
            }
          })
        }
      }
    })
  },

  // 获取选中的食材
  getCheckedFoods: function () {
    var checkedFoods = []
    for (var i = 0; i < this.data.foods.length; i++) {
      if (this.data.foods[i].checked) {
        checkedFoods.push(this.data.foods[i])
      }
    }
    return checkedFoods
  },

  // 获取菜谱推荐
  getRecipe: function () {
    var that = this
    var checkedFoods = that.getCheckedFoods()
    
    if (checkedFoods.length === 0) {
      wx.showToast({
        title: '请至少选择一个食材',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '正在推荐菜谱...'
    })

    recipeUtil.getRecipeRecommendations(checkedFoods).then(function (result) {
      wx.hideLoading()
      that.setData({ 
        recipes: result.recipes || [],
        hasRecipes: true,
        showRecipePopup: true,
        recommendMessage: result.message || ''
      })
    }).catch(function (err) {
      wx.hideLoading()
      console.error('推荐失败:', err)
      wx.showToast({ title: '推荐失败', icon: 'none' })
    })
  },

  // 换一批
  refreshRecipes: function () {
    var that = this
    var checkedFoods = that.getCheckedFoods()
    
    if (checkedFoods.length === 0) {
      wx.showToast({ title: '请至少选择一个食材', icon: 'none' })
      return
    }

    wx.showLoading({ title: '重新推荐中...' })

    recipeUtil.getRecipeRecommendations(checkedFoods).then(function (result) {
      wx.hideLoading()
      that.setData({ 
        recipes: result.recipes || [],
        showRecipePopup: true,
        recommendMessage: result.message || ''
      })
    }).catch(function (err) {
      wx.hideLoading()
      console.error('推荐失败:', err)
      wx.showToast({ title: '推荐失败', icon: 'none' })
    })
  },

  // 关闭浮动卡片
  closeRecipePopup: function () {
    this.setData({ showRecipePopup: false })
  },

  // 跳转到菜谱详情
  goToRecipe: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/recipe/recipe?id=' + id
    })
  },

  // 统一处理推荐按钮点击
  onRecipeBtnTap: function () {
    if (this.data.hasRecipes) {
      this.refreshRecipes()
    } else {
      this.getRecipe()
    }
  },

  // 阻止弹窗内容点击冒泡关闭弹窗
  preventClose: function () {}
})
