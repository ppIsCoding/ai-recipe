# 快手小厨 - 基于膳食指南的健康菜谱推荐

一款专为职场人士设计的健康菜谱推荐微信小程序，基于《中国居民膳食指南2022》，帮助解决"今晚吃什么"的难题。

## 核心功能

- **今晚吃什么**：一键推荐健康轻烹饪菜谱（30分钟内）
- **健康标签筛选**：少盐、少油、高蛋白、轻烹饪四大核心标签
- **拍照识别食材**：AI智能识别食材，推荐可行菜谱
- **BMI健康分析**：根据个人信息计算BMI，提供个性化饮食建议
- **膳食指南建议**：基于《中国居民膳食指南2022》的权威健康指导

## 技术架构

- **前端**：微信小程序原生开发
- **后端**：FastAPI + LangGraph Agent
- **AI识别**：百度AI开放平台（菜品识别 + 果蔬识别）
- **AI对话**：通义千问大模型
- **数据库**：MySQL + SQLAlchemy

## 产品定位

- **目标用户**：职场人士（时间紧张、有健康意识）
- **核心场景**：解决"不知道吃什么" + "如何吃的健康"
- **权威背书**：《中国居民膳食指南2022》

## 健康标签体系

| 标签 | 判定标准 | 对应膳食指南准则 |
|------|---------|----------------|
| 🧂 少盐 | 每份盐 ≤ 2g | 准则5：少盐少油，控糖限酒 |
| 🫒 少油 | 每份用油 ≤ 15g | 准则5：少盐少油，控糖限酒 |
| 💪 高蛋白 | 蛋白质 ≥ 20g/份 | 准则4：适量吃鱼、禽、蛋、瘦肉 |
| ⏱️ 轻烹饪 | 烹饪时间 ≤ 30分钟 | 职场场景：快速烹饪 |

## 项目结构

```
ai-recipe/
├── miniprogram/                    # 小程序前端代码
│   ├── pages/
│   │   ├── index/                  # 首页（今晚吃什么）
│   │   ├── camera/                 # 拍照识别页
│   │   ├── result/                 # 识别结果页
│   │   ├── recipe/                 # 菜谱详情页
│   │   ├── ai-chat/                # AI对话页
│   │   ├── profile/                # 个人中心
│   │   ├── profile-edit/           # 个人信息编辑
│   │   ├── health-analysis/        # BMI健康分析
│   │   ├── favorites/              # 收藏列表
│   │   ├── history/                # 做菜历史
│   │   └── nutrition/              # 营养分析
│   ├── utils/
│   │   └── baidu-ai.js             # 百度AI调用封装
│   ├── config.js                   # 配置加载器
│   └── app.js                      # 小程序入口
│
├── backend/                        # FastAPI后端
│   ├── api/                        # API路由
│   │   ├── recognize.py            # 食材识别
│   │   ├── recipe.py               # 菜谱推荐
│   │   ├── chat.py                 # AI对话
│   │   ├── users.py                # 用户管理+健康分析
│   │   ├── favorites.py            # 收藏管理
│   │   ├── history.py              # 做菜历史
│   │   └── nutrition.py            # 营养分析
│   ├── agents/                     # LangGraph Agent
│   │   ├── recipe_agent.py         # 菜谱推荐Agent
│   │   ├── recognition_agent.py    # 食材识别Agent
│   │   ├── chat_agent.py           # AI对话Agent
│   │   └── nutrition_agent.py      # 营养分析Agent
│   ├── services/                   # 外部服务封装
│   │   ├── baidu_service.py        # 百度AI服务
│   │   └── qwen_service.py         # 通义千问服务
│   ├── models/                     # 数据库模型
│   │   ├── database.py             # 数据库连接
│   │   └── tables.py               # 表结构定义
│   └── main.py                     # 后端入口
│
├── database/
│   └── init.sql                    # 数据库初始化脚本
│
└── README.md
```

## 使用指南

### 1. 环境准备

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册 [微信小程序账号](https://mp.weixin.qq.com/) 获取 AppID
3. 注册 [百度AI开放平台](https://ai.baidu.com/) 获取 API Key
4. 注册 [通义千问](https://dashscope.aliyun.com/) 获取 API Key

### 2. 配置项目

1. 打开微信开发者工具，导入项目
2. 复制 `miniprogram/secrets.example.js` 为 `miniprogram/secrets.js`
3. 在 `secrets.js` 中填入你的 API 密钥
4. 在 `project.config.json` 中填入你的 AppID

### 3. 数据库初始化

```bash
mysql -u root -p < database/init.sql
```

### 4. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. 运行小程序

在微信开发者工具中点击"编译"即可运行。

## 健康分析功能

系统根据用户填写的个人信息（性别、年龄、身高、体重、活动量、健康目标）计算：

- **BMI**：身体质量指数，基于中国标准判定偏瘦/正常/超重/肥胖
- **BMR**：基础代谢率，使用 Mifflin-St Jeor 公式
- **TDEE**：每日总消耗，根据活动量计算
- **目标热量**：根据健康目标（减脂/维持/增肌）调整
- **营养目标**：蛋白质、脂肪、碳水的每日推荐摄入量

## 注意事项

1. **API调用限制**：百度AI每天免费500次调用，开发测试时注意控制调用频率
2. **图片大小**：上传图片建议压缩到4MB以内，避免识别超时
3. **数据安全**：`secrets.js` 包含真实密钥，已被 `.gitignore` 忽略

## 后续优化

- [ ] 添加菜谱收藏同步功能
- [ ] 添加做菜计时器
- [ ] 添加语音播报功能
- [ ] 添加社区分享功能
- [ ] 添加更多健康菜谱数据

## 联系方式

如有问题，请联系：AI_Challenge@126.com

## 许可证

MIT License
