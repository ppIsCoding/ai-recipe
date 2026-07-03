/**
 * 敏感配置文件示例
 * 
 * 使用说明：
 * 1. 复制此文件并重命名为 secrets.js
 * 2. 填入你自己的 API 密钥
 * 3. secrets.js 已被 .gitignore 忽略，不会提交到版本库
 * 
 * ⚠️ 警告：请勿将此文件提交到版本库！
 */

var secrets = {
  // 微信小程序 AppID
  appId: '你的AppID',
  
  // 后端服务地址
  backendUrl: 'http://localhost:8000'
}

module.exports = secrets
