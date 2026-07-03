/**
 * 项目配置文件
 * 
 * 敏感配置从 secrets.js 加载（该文件已被 .gitignore 忽略）
 * 首次使用请复制 secrets.example.js 为 secrets.js 并填入你的 API 密钥
 */

// 尝试加载敏感配置
var secrets = {}
try {
  secrets = require('./secrets.js')
} catch (e) {
  console.warn('未找到 secrets.js 文件，请复制 secrets.example.js 为 secrets.js 并填入你的 API 密钥')
}

var config = {
  // 微信小程序配置
  appId: secrets.appId || '',
  
  // 后端服务地址
  backendUrl: secrets.backendUrl || 'http://localhost:8000'
}

module.exports = config
