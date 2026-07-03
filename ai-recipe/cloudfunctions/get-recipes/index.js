// 获取菜谱云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 格式化菜谱数据
function formatRecipe(recipe) {
  return {
    id: recipe.id || recipe.mysql_id,
    name: recipe.name,
    description: recipe.description || '',
    difficulty: recipe.difficulty || '简单',
    cook_time: recipe.cook_time || '',
    servings: recipe.servings || '',
    main_ingredients: recipe.main_ingredients || [],
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    nutrition: recipe.nutrition || {},
    image_url: recipe.image_url || '',
    category: recipe.category || '家常菜',
    health_tags: recipe.health_tags || [],
    oil_per_serving: recipe.oil_per_serving || 0,
    salt_per_serving: recipe.salt_per_serving || 0,
    fiber_per_serving: recipe.fiber_per_serving || 0
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, category, recipe_id, page = 1, page_size = 50 } = event
  
  try {
    const recipesCollection = db.collection('recipes')
    
    // 获取单个菜谱详情
    if (action === 'detail' && recipe_id) {
      const { data } = await recipesCollection.where({
        id: recipe_id
      }).get()
      
      if (data.length === 0) {
        return {
          success: false,
          message: '菜谱不存在'
        }
      }
      
      return {
        success: true,
        recipe: formatRecipe(data[0])
      }
    }
    
    // 获取菜谱列表
    let query = recipesCollection
    
    if (category) {
      query = query.where({
        category: category
      })
    }
    
    // 获取总数
    const countResult = await query.count()
    const total = countResult.total
    
    // 分页查询
    const { data: recipes } = await query
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get()
    
    const formattedRecipes = recipes.map(formatRecipe)
    
    return {
      success: true,
      recipes: formattedRecipes,
      total: total
    }
  } catch (err) {
    console.error('获取菜谱失败:', err)
    return {
      success: false,
      message: err.message || '获取菜谱失败',
      recipes: []
    }
  }
}
