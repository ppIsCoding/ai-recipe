// 做菜历史云函数（完整版）
// 支持分页、关联查询菜谱图片

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, user_id, recipe_id, recipe_name, cook_time, rating, note, page, page_size, record_id } = event
  
  try {
    const historyCollection = db.collection('cook_history')
    
    switch (action) {
      // 添加做菜记录
      case 'add': {
        if (!user_id || !recipe_id) {
          return { success: false, message: '参数不完整' }
        }
        
        const record = {
          user_id: user_id,
          recipe_id: recipe_id,
          recipe_name: recipe_name || '',
          cook_time: cook_time || 0,
          rating: rating || 5,
          note: note || '',
          created_at: db.serverDate()
        }
        
        await historyCollection.add({
          data: record
        })
        
        return {
          success: true,
          message: '记录已添加'
        }
      }
      
      // 获取历史列表（支持分页）
      case 'list': {
        if (!user_id) {
          return { success: true, history: [], total: 0 }
        }
        
        const currentPage = page || 1
        const pageSize = page_size || 20
        const skip = (currentPage - 1) * pageSize
        
        // 获取总数
        const countResult = await historyCollection.where({
          user_id: user_id
        }).count()
        const total = countResult.total
        
        // 获取历史记录
        const { data: history } = await historyCollection.where({
          user_id: user_id
        }).orderBy('created_at', 'desc').skip(skip).limit(pageSize).get()
        
        // 批量查询菜谱图片
        const recipeIds = [...new Set(history.map(h => h.recipe_id))]
        let recipeImages = {}
        
        if (recipeIds.length > 0) {
          // 云数据库in查询限制20条，需要分批查询
          for (let i = 0; i < recipeIds.length; i += 20) {
            const batchIds = recipeIds.slice(i, i + 20)
            const { data: recipes } = await db.collection('recipes').where({
              id: _.in(batchIds)
            }).get()
            recipes.forEach(r => {
              recipeImages[r.id] = r.image_url || ''
            })
          }
        }
        
        return {
          success: true,
          history: history.map(h => ({
            id: h._id,
            recipe_id: h.recipe_id,
            recipe_name: h.recipe_name,
            cook_time: h.cook_time,
            rating: h.rating,
            note: h.note,
            created_at: h.created_at,
            image_url: recipeImages[h.recipe_id] || ''
          })),
          total: total
        }
      }
      
      // 删除历史记录
      case 'delete': {
        if (!record_id) {
          return { success: false, message: '缺少记录ID' }
        }
        
        await historyCollection.doc(record_id).remove()
        
        return {
          success: true,
          message: '记录已删除'
        }
      }
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('历史记录操作失败:', err)
    return {
      success: false,
      message: err.message || '操作失败'
    }
  }
}
