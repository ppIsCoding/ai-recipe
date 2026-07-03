// 收藏管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, user_id, recipe_id } = event
  
  try {
    const favoritesCollection = db.collection('favorites')
    
    switch (action) {
      // 切换收藏状态
      case 'toggle': {
        if (!user_id || !recipe_id) {
          return { success: false, message: '参数不完整' }
        }
        
        const { data: existing } = await favoritesCollection.where({
          user_id: user_id,
          recipe_id: recipe_id
        }).get()
        
        if (existing.length > 0) {
          // 取消收藏
          await favoritesCollection.doc(existing[0]._id).remove()
          return {
            success: true,
            is_favorite: false,
            message: '已取消收藏'
          }
        } else {
          // 添加收藏
          await favoritesCollection.add({
            data: {
              user_id: user_id,
              recipe_id: recipe_id,
              created_at: db.serverDate()
            }
          })
          return {
            success: true,
            is_favorite: true,
            message: '已收藏'
          }
        }
      }
      
      // 检查是否已收藏
      case 'check': {
        if (!user_id || !recipe_id) {
          return { success: true, is_favorite: false }
        }
        
        const { data } = await favoritesCollection.where({
          user_id: user_id,
          recipe_id: recipe_id
        }).get()
        
        return {
          success: true,
          is_favorite: data.length > 0
        }
      }
      
      // 获取收藏列表
      case 'list': {
        if (!user_id) {
          return { success: true, favorites: [] }
        }
        
        // 获取用户的收藏记录
        const { data: favs } = await favoritesCollection.where({
          user_id: user_id
        }).orderBy('created_at', 'desc').get()
        
        if (favs.length === 0) {
          return { success: true, favorites: [] }
        }
        
        // 获取收藏的菜谱详情
        const recipeIds = favs.map(f => f.recipe_id)
        
        // 云数据库in查询限制20条，需要分批查询
        let recipes = []
        for (let i = 0; i < recipeIds.length; i += 20) {
          const batchIds = recipeIds.slice(i, i + 20)
          const { data: batchRecipes } = await db.collection('recipes').where({
            id: _.in(batchIds)
          }).get()
          recipes = recipes.concat(batchRecipes)
        }
        
        // 按收藏时间排序
        const sortedRecipes = recipeIds.map(id => 
          recipes.find(r => r.id === id)
        ).filter(Boolean)
        
        return {
          success: true,
          favorites: sortedRecipes.map(r => ({
            id: r.id,
            name: r.name,
            image_url: r.image_url || '',
            description: r.description || '',
            difficulty: r.difficulty || '简单',
            cook_time: r.cook_time || ''
          }))
        }
      }
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('收藏操作失败:', err)
    return {
      success: false,
      message: err.message || '操作失败'
    }
  }
}
