// 用户登录云函数
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 用微信 code 换取 openid
async function code2session(code) {
  const appid = process.env.WECHAT_APPID || 'wxdbab423c5f0a8e86'
  const secret = process.env.WECHAT_SECRET || '431777a15107d26334adfffb9ee1a3e7'
  
  const url = `https://api.weixin.qq.com/sns/jscode2session`
  const params = {
    appid,
    secret,
    js_code: code,
    grant_type: 'authorization_code'
  }
  
  const res = await axios.get(url, { params })
  return res.data
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { code, nickname, avatar_url } = event
  
  try {
    // 1. 用 code 换取 openid
    const wxData = await code2session(code)
    const openid = wxData.openid
    
    if (!openid) {
      return {
        success: false,
        message: '获取openid失败'
      }
    }
    
    console.log('用户登录, openid:', openid)
    
    // 2. 查找或创建用户
    const usersCollection = db.collection('users')
    const { data: existingUsers } = await usersCollection.where({
      id: openid
    }).get()
    
    let user = null
    
    if (existingUsers.length > 0) {
      // 更新用户信息
      const updateData = {}
      if (nickname) updateData.nickname = nickname
      if (avatar_url) updateData.avatar_url = avatar_url
      
      await usersCollection.doc(existingUsers[0]._id).update({
        data: updateData
      })
      
      user = {
        ...existingUsers[0],
        ...updateData
      }
    } else {
      // 创建新用户
      const newUser = {
        id: openid,
        nickname: nickname || '微信用户',
        avatar_url: avatar_url || '',
        taste: [],
        avoid: [],
        created_at: db.serverDate(),
        gender: null,
        age: null,
        height: null,
        weight: null,
        activity_level: 'sedentary',
        health_goal: 'maintain'
      }
      
      const result = await usersCollection.add({
        data: newUser
      })
      
      user = {
        _id: result._id,
        ...newUser
      }
    }
    
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
      },
      message: '登录成功'
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      message: err.message || '登录失败'
    }
  }
}
