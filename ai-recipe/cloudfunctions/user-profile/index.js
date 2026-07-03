// 用户信息管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, openid, gender, age, height, weight, activity_level, health_goal, taste, avoid } = event
  
  try {
    const usersCollection = db.collection('users')
    
    switch (action) {
      // 获取用户信息
      case 'get': {
        if (!openid) {
          return { success: false, message: '缺少用户ID' }
        }
        
        const { data: users } = await usersCollection.where({
          id: openid
        }).get()
        
        if (users.length === 0) {
          return { success: false, message: '用户不存在' }
        }
        
        const user = users[0]
        return {
          success: true,
          user: {
            openid: user.id,
            nickname: user.nickname || '',
            avatar_url: user.avatar_url || '',
            taste: user.taste || [],
            avoid: user.avoid || [],
            gender: user.gender,
            age: user.age,
            height: user.height,
            weight: user.weight,
            activity_level: user.activity_level || 'sedentary',
            health_goal: user.health_goal || 'maintain'
          }
        }
      }
      
      // 更新用户个人信息
      case 'updateProfile': {
        if (!openid) {
          return { success: false, message: '缺少用户ID' }
        }
        
        const { data: existingUsers } = await usersCollection.where({
          id: openid
        }).get()
        
        if (existingUsers.length === 0) {
          return { success: false, message: '用户不存在' }
        }
        
        const updateData = {}
        if (gender !== undefined) updateData.gender = gender
        if (age !== undefined) updateData.age = age
        if (height !== undefined) updateData.height = height
        if (weight !== undefined) updateData.weight = weight
        if (activity_level !== undefined) updateData.activity_level = activity_level
        if (health_goal !== undefined) updateData.health_goal = health_goal
        
        await usersCollection.doc(existingUsers[0]._id).update({
          data: updateData
        })
        
        return {
          success: true,
          message: '个人信息已更新'
        }
      }
      
      // 更新用户偏好
      case 'updatePreferences': {
        if (!openid) {
          return { success: false, message: '缺少用户ID' }
        }
        
        const { data: existingUsers } = await usersCollection.where({
          id: openid
        }).get()
        
        if (existingUsers.length === 0) {
          return { success: false, message: '用户不存在' }
        }
        
        const updateData = {}
        if (taste !== undefined) updateData.taste = taste
        if (avoid !== undefined) updateData.avoid = avoid
        
        await usersCollection.doc(existingUsers[0]._id).update({
          data: updateData
        })
        
        return {
          success: true,
          message: '偏好已更新'
        }
      }
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('用户信息操作失败:', err)
    return {
      success: false,
      message: err.message || '操作失败'
    }
  }
}
