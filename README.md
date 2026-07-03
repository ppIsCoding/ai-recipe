# 轻食智星 - AI健康膳食规划与烹饪助手

> 基于《中国居民膳食指南2022》的智能健康菜谱推荐微信小程序
>
> 🚀 **Vibe Coding 项目** - 通过AI辅助开发，体验从0到1的完整产品开发流程

[![微信小程序](https://img.shields.io/badge/微信小程序-原生开发-green)](https://developers.weixin.qq.com/miniprogram/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-blue)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow)](https://www.python.org/)
[![AI-Assisted](https://img.shields.io/badge/AI--Assisted-Vibe%20Coding-purple)](https://github.com/ppIsCoding/ai-recipe)
[![License](https://img.shields.io/badge/License-MIT-red)](LICENSE)

## 项目简介

**轻食智星**是一款专为职场人士设计的AI健康膳食规划与烹饪助手。项目基于《中国居民膳食指南2022》，结合AI技术，帮助用户解决"今晚吃什么"的难题，同时提供科学的健康饮食建议。

### 💡 项目亮点：Vibe Coding 实践

这是一个 **Vibe Coding** 项目，展示了AI辅助开发的完整实践：

- **快速原型**：通过与AI对话，快速验证产品想法和技术方案
- **全栈开发**：从需求分析到代码实现，全程AI协作完成
- **工程实践**：在AI辅助下，完成了完整的前后端架构设计和实现
- **持续迭代**：通过AI对话不断优化代码质量和功能设计

> 这个项目不仅是技术实践，更是探索 **人机协作开发模式** 的一次尝试。通过Vibe Coding，我深刻体会到AI作为开发助手的价值，以及如何高效地与AI协作完成复杂项目。

### 核心价值

- **智能推荐**：基于用户偏好和健康目标，AI智能推荐菜谱
- **权威依据**：严格遵循《中国居民膳食指南2022》标准
- **便捷高效**：30分钟内轻烹饪，适合快节奏职场生活
- **个性化服务**：根据用户身体数据提供定制化饮食方案

## 功能特性

### 智能菜谱推荐
- **今晚吃什么**：一键推荐健康轻烹饪菜谱
- **健康标签筛选**：少盐、少油、高蛋白、轻烹饪四大核心标签
- **个性化推荐**：基于用户历史偏好和健康目标

### AI智能识别
- **拍照识别食材**：AI智能识别食材，推荐可行菜谱
- **菜品识别**：识别已烹饪菜品，分析营养成分
- **多模态交互**：支持图片、文字多种输入方式

### 健康管理
- **BMI健康分析**：根据个人信息计算BMI，提供个性化饮食建议
- **营养目标设定**：根据健康目标自动计算每日营养摄入目标
- **饮食记录**：记录每日饮食，分析营养摄入情况

### AI对话助手
- **智能问答**：基于通义千问大模型的AI烹饪助手
- **菜谱咨询**：提供菜谱推荐、烹饪技巧等专业建议
- **健康指导**：基于膳食指南的个性化健康饮食指导

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小程序前端                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 首页    │ │ AI助手  │ │ 拍照    │ │ 我的    │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI 后端服务                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LangGraph Agent 智能体                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │菜谱推荐 │ │食材识别 │ │AI对话   │ │营养分析 │   │   │
│  │  │Agent    │ │Agent    │ │Agent    │ │Agent    │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    外部服务集成                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ 百度AI开放  │  │ 通义千问    │  │ MySQL       │ │   │
│  │  │ 平台        │  │ 大模型      │  │ 数据库      │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | 微信小程序原生开发 | WXML + WXSS + JavaScript |
| **后端** | FastAPI | 高性能异步Web框架 |
| **AI框架** | LangGraph | 多Agent协作框架 |
| **AI识别** | 百度AI开放平台 | 菜品识别 + 果蔬识别 |
| **AI对话** | 通义千问大模型 | 智能对话生成 |
| **数据库** | MySQL + SQLAlchemy | 关系型数据库 + ORM |
| **云服务** | 微信云开发 | 云函数 + 云数据库 |

## 健康标签体系

项目基于《中国居民膳食指南2022》建立了一套完整的健康标签体系：

| 标签 | 判定标准 | 膳食指南依据 | 健康价值 |
|------|----------|--------------|----------|
| 🧂 **少盐** | 每份盐 ≤ 2g | 准则5：少盐少油，控糖限酒 | 预防高血压 |
| 🫒 **少油** | 每份用油 ≤ 15g | 准则5：少盐少油，控糖限酒 | 控制血脂 |
| 💪 **高蛋白** | 蛋白质 ≥ 20g/份 | 准则4：适量吃鱼、禽、蛋、瘦肉 | 增强体质 |
| ⏱️ **轻烹饪** | 烹饪时间 ≤ 30分钟 | 职场场景：快速烹饪 | 节省时间 |

## 快速开始

### 环境要求

- **微信开发者工具**：最新版本
- **Python**：3.11 或更高版本
- **MySQL**：8.0 或更高版本
- **Node.js**：18.0 或更高版本（用于云函数）

### 1. 克隆项目

```bash
git clone https://github.com/ppIsCoding/ai-recipe.git
cd ai-recipe
```

### 2. 后端配置

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的API密钥
```

### 3. 数据库初始化

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql
```

### 4. 启动后端服务

```bash
# 在backend目录下
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 小程序配置

1. 打开**微信开发者工具**
2. 导入项目目录 `miniprogram`
3. 复制 `miniprogram/secrets.example.js` 为 `miniprogram/secrets.js`
4. 在 `secrets.js` 中填入你的API密钥：
   ```javascript
   module.exports = {
     appId: '你的小程序AppID',
     backendUrl: 'http://localhost:8000',
     baiduAI: {
       apiKey: '你的百度AI API Key',
       secretKey: '你的百度AI Secret Key'
     },
     qwen: {
       apiKey: '你的通义千问 API Key'
     }
   }
   ```

### 6. 运行小程序

在微信开发者工具中点击"编译"即可运行。

## 项目结构

```
ai-recipe/
├── miniprogram/                    # 小程序前端
│   ├── pages/
│   │   ├── index/                  # 首页 - 今晚吃什么
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
│   ├── components/                 # 自定义组件
│   │   ├── recipe-card/            # 菜谱卡片组件
│   │   └── icon-svg/               # SVG图标组件
│   ├── utils/                      # 工具函数
│   │   ├── ai-chat.js              # AI对话封装
│   │   ├── baidu-ai.js             # 百度AI调用
│   │   ├── qwen-chat.js            # 通义千问调用
│   │   ├── auth.js                 # 用户认证
│   │   ├── favorites.js            # 收藏管理
│   │   ├── history.js              # 历史记录
│   │   ├── health.js               # 健康计算
│   │   ├── recipe.js               # 菜谱工具
│   │   └── markdown.js             # Markdown渲染
│   ├── config.js                   # 配置加载器
│   ├── secrets.example.js          # 密钥配置示例
│   └── app.js                      # 小程序入口
│
├── backend/                        # FastAPI后端
│   ├── api/                        # API路由
│   │   ├── recognize.py            # 食材识别API
│   │   ├── recipe.py               # 菜谱推荐API
│   │   ├── chat.py                 # AI对话API
│   │   ├── users.py                # 用户管理API
│   │   ├── favorites.py            # 收藏管理API
│   │   ├── history.py              # 做菜历史API
│   │   └── nutrition.py            # 营养分析API
│   ├── agents/                     # LangGraph智能体
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
│   ├── config/                     # 配置管理
│   │   └── __init__.py             # 配置加载
│   ├── utils/                      # 工具函数
│   │   └── __init__.py
│   └── main.py                     # 后端入口
│
├── cloudfunctions/                 # 微信云函数
│   ├── ai-chat/                    # AI对话云函数
│   ├── cook-history/               # 做菜历史云函数
│   ├── favorites/                  # 收藏管理云函数
│   ├── get-recipes/                # 获取菜谱云函数
│   ├── health-analysis/            # 健康分析云函数
│   ├── nutrition-analyze/          # 营养分析云函数
│   ├── recipe-recommend/           # 菜谱推荐云函数
│   ├── recognize-food/             # 食物识别云函数
│   ├── user-login/                 # 用户登录云函数
│   └── user-profile/               # 用户资料云函数
│
├── database/                       # 数据库脚本
│   ├── init.sql                    # 数据库初始化
│   ├── recipes_data.sql            # 菜谱数据
│   └── update_recipes.sql          # 菜谱更新
│
├── wechat_cloud_data/              # 微信云数据
│   ├── users.json                  # 用户数据
│   ├── recipes.json                # 菜谱数据
│   ├── favorites.json              # 收藏数据
│   ├── cook_history.json           # 做菜历史
│   └── nutrition_logs.json         # 营养记录
│
└── export_mysql_to_wechat_cloud.py # 数据导出工具
```

## API文档

启动后端服务后，访问以下地址查看API文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要API端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/recognize` | POST | 食材/菜品识别 |
| `/api/recipe/recommend` | GET | 菜谱推荐 |
| `/api/chat` | POST | AI对话 |
| `/api/users/profile` | GET/PUT | 用户资料管理 |
| `/api/favorites` | GET/POST | 收藏管理 |
| `/api/history` | GET | 做菜历史 |
| `/api/nutrition/analyze` | POST | 营养分析 |

## 健康分析算法

系统根据用户填写的个人信息计算以下健康指标：

### BMI计算
```
BMI = 体重(kg) / 身高(m)²

中国标准：
- 偏瘦：BMI < 18.5
- 正常：18.5 ≤ BMI < 24
- 超重：24 ≤ BMI < 28
- 肥胖：BMI ≥ 28
```

### BMR计算（基础代谢率）
```
Mifflin-St Jeor公式：
男性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161 + 5
女性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161 - 161
```

### TDEE计算（每日总消耗）
```
TDEE = BMR × 活动系数

活动系数：
- 久坐：1.2
- 轻度活动：1.375
- 中度活动：1.55
- 高度活动：1.725
- 超高度活动：1.9
```

## 注意事项

### API调用限制
- **百度AI**：每天免费500次调用
- **通义千问**：根据套餐限制
- 开发测试时注意控制调用频率

### 数据安全
- `secrets.js` 包含真实密钥，已被 `.gitignore` 忽略
- 不要将密钥提交到代码仓库
- 生产环境建议使用环境变量

### 图片限制
- 上传图片建议压缩到4MB以内
- 支持格式：JPG、PNG、BMP
- 避免识别超时

## 开发指南

### 添加新功能

1. **前端页面**：在 `miniprogram/pages/` 下创建新页面目录
2. **后端API**：在 `backend/api/` 下创建新的路由文件
3. **云函数**：在 `cloudfunctions/` 下创建新的云函数
4. **数据库**：在 `database/` 下更新SQL脚本

### 代码规范

- **前端**：遵循微信小程序开发规范
- **后端**：遵循PEP 8 Python代码规范
- **注释**：关键函数和类需要添加文档字符串
- **命名**：使用有意义的变量和函数名

### 测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
# 使用微信开发者工具进行真机调试
```

## 部署说明

### 后端部署

```bash
# 使用Gunicorn部署
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# 或使用Docker
docker build -t ai-recipe-backend .
docker run -p 8000:8000 ai-recipe-backend
```

### 小程序发布

1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目描述
3. 登录微信公众平台提交审核
4. 审核通过后发布

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- **项目主页**：https://github.com/ppIsCoding/ai-recipe
- **问题反馈**：https://github.com/ppIsCoding/ai-recipe/issues
- **邮箱**：3289609037@qq.com

## 致谢

- [《中国居民膳食指南2022》](http://dg.cnsoc.org/article/04/7Mj210yEdFUx7WjSZ0elWQ.html) - 健康饮食标准
- [百度AI开放平台](https://ai.baidu.com/) - 图像识别服务
- [通义千问](https://dashscope.aliyun.com/) - 大语言模型
- [FastAPI](https://fastapi.tiangolo.com/) - Web框架
- [微信小程序](https://developers.weixin.qq.com/miniprogram/) - 开发平台

## 关于开发者

这个项目是我通过 **Vibe Coding** 方式独立完成的全栈项目，体现了以下能力：

- **技术广度**：微信小程序 + Python后端 + AI集成 + 数据库设计
- **AI协作能力**：善于利用AI工具提效，掌握人机协作开发模式
- **产品思维**：从用户需求出发，设计完整的产品功能和交互
- **工程能力**：完成从需求分析、架构设计到代码实现的全流程

> 💼 **求职方向**：后端开发 / 全栈开发 / AI应用开发
>
> 📧 **联系方式**：3289609037@qq.com

---

**轻食智星** - 让健康饮食更简单 🥗

*本项目通过 Vibe Coding 开发完成，感谢AI作为我的编程伙伴！*