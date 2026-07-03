# -*- coding: utf-8 -*-
"""
MySQL数据导出到微信云开发数据库格式
将本地MySQL数据库的数据导出为JSON格式，以便导入到微信云开发的MongoDB数据库中
"""

import pymysql
import json
import os
from datetime import datetime
from decimal import Decimal
from dotenv import load_dotenv
from pathlib import Path

# 自定义JSON编码器，处理Decimal和datetime类型
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        return super().default(obj)


# 加载环境变量
backend_dir = Path(__file__).parent / "backend"
load_dotenv(backend_dir / ".env")

# 数据库连接配置
DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", 3306)),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "root"),
    "database": os.getenv("MYSQL_DATABASE", "ai_recipe"),
    "charset": "utf8mb4"
}

# 导出目录
EXPORT_DIR = Path(__file__).parent / "wechat_cloud_data"


def create_export_dir():
    """创建导出目录"""
    if not EXPORT_DIR.exists():
        EXPORT_DIR.mkdir(parents=True)
        print(f"创建导出目录: {EXPORT_DIR}")


def get_connection():
    """获取数据库连接"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        print(f"成功连接到MySQL数据库: {DB_CONFIG['database']}")
        return conn
    except Exception as e:
        print(f"连接数据库失败: {e}")
        return None





def convert_json_fields(row, table_name):
    """转换JSON字段"""
    # 需要转换的JSON字段
    json_fields = {
        "users": ["taste", "avoid"],
        "recipes": ["main_ingredients", "ingredients", "steps", "nutrition", "health_tags"],
        "favorites": [],
        "cook_history": [],
        "nutrition_logs": ["foods", "recommended_recipes"]
    }
    
    if table_name in json_fields:
        for field in json_fields[table_name]:
            if field in row and row[field] is not None:
                if isinstance(row[field], str):
                    try:
                        row[field] = json.loads(row[field])
                    except json.JSONDecodeError:
                        pass
    return row


def export_table(conn, table_name, query=None):
    """导出单个表的数据"""
    if query is None:
        query = f"SELECT * FROM {table_name}"
    
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # 转换数据
            converted_rows = []
            for row in rows:
                # 转换JSON字段
                row = convert_json_fields(row, table_name)
                
                # 移除MySQL自增ID（MongoDB会自动生成_id）
                # 但保留原始ID作为备用字段
                if "id" in row:
                    row["mysql_id"] = row["id"]
                    # 对于recipes表，保留id作为备用
                    if table_name == "recipes":
                        row["id"] = row["id"]
                
                converted_rows.append(row)
            
            # 保存为JSON Lines格式（每行一个JSON对象）
            output_file = EXPORT_DIR / f"{table_name}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                for row in converted_rows:
                    f.write(json.dumps(row, ensure_ascii=False, cls=CustomJSONEncoder) + "\n")
            
            print(f"导出表 {table_name}: {len(rows)} 条记录 -> {output_file}")
            return len(rows)
            
    except Exception as e:
        print(f"导出表 {table_name} 失败: {e}")
        return 0


def export_all_tables():
    """导出所有表"""
    conn = get_connection()
    if not conn:
        return
    
    try:
        create_export_dir()
        
        # 导出所有表
        tables = ["users", "recipes", "favorites", "cook_history", "nutrition_logs"]
        total_records = 0
        
        for table in tables:
            count = export_table(conn, table)
            total_records += count
        
        print(f"\n导出完成！共导出 {total_records} 条记录")
        print(f"导出文件保存在: {EXPORT_DIR}")
        
    finally:
        conn.close()
        print("数据库连接已关闭")


def generate_import_instructions():
    """生成导入说明文档"""
    instructions = """
# 微信云开发数据库导入说明

## 导出文件说明

导出的数据文件保存在 `wechat_cloud_data` 目录下，包含以下JSON文件：

1. `users.json` - 用户表数据
2. `recipes.json` - 菜谱表数据
3. `favorites.json` - 收藏表数据
4. `cook_history.json` - 做菜历史表数据
5. `nutrition_logs.json` - 营养分析缓存表数据

## 导入步骤

### 方法一：使用微信开发者工具导入

1. 打开微信开发者工具
2. 进入云开发控制台
3. 选择"数据库"
4. 创建对应的集合（collection）：
   - `users` 集合
   - `recipes` 集合
   - `favorites` 集合
   - `cook_history` 集合
   - `nutrition_logs` 集合
5. 对于每个集合：
   - 点击"导入"按钮
   - 选择对应的JSON文件
   - 选择"JSON数组"格式
   - 点击"确定"导入

### 方法二：使用云函数批量导入

创建一个云函数来批量导入数据：

```javascript
// cloudfunctions/importData/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { collectionName, data } = event
  
  try {
    // 批量插入数据
    const result = await db.collection(collectionName).add({
      data: data
    })
    return {
      success: true,
      message: `成功导入 ${data.length} 条记录到 ${collectionName}`,
      result: result
    }
  } catch (err) {
    return {
      success: false,
      message: `导入失败: ${err.message}`,
      error: err
    }
  }
}
```

然后调用云函数导入数据：

```javascript
// 在小程序中调用
const data = require('./wechat_cloud_data/recipes.json')

wx.cloud.callFunction({
  name: 'importData',
  data: {
    collectionName: 'recipes',
    data: data
  },
  success: res => {
    console.log('导入成功:', res)
  },
  fail: err => {
    console.error('导入失败:', err)
  }
})
```

## 数据格式说明

### users.json
```json
{
  "mysql_id": "用户ID（原始MySQL ID）",
  "id": "微信openid",
  "nickname": "昵称",
  "avatar_url": "头像URL",
  "taste": ["口味偏好"],
  "avoid": ["忌口"],
  "created_at": "创建时间",
  "gender": "性别",
  "age": "年龄",
  "height": "身高",
  "weight": "体重",
  "activity_level": "活动量",
  "health_goal": "健康目标"
}
```

### recipes.json
```json
{
  "mysql_id": "菜谱ID（原始MySQL ID）",
  "id": "菜谱ID",
  "name": "菜谱名称",
  "description": "描述",
  "difficulty": "难度",
  "cook_time": "烹饪时间",
  "servings": "份量",
  "main_ingredients": ["主要食材"],
  "ingredients": [{"name": "食材名", "amount": "用量"}],
  "steps": [{"step": 1, "desc": "步骤描述"}],
  "nutrition": {"calories": 180, "protein": 12, "fat": 10, "carbs": 8},
  "image_url": "图片URL",
  "category": "分类",
  "health_tags": ["健康标签"],
  "oil_per_serving": "每份用油量(g)",
  "salt_per_serving": "每份用盐量(g)",
  "fiber_per_serving": "每份膳食纤维(g)"
}
```

## 注意事项

1. 微信云开发数据库是MongoDB，数据格式为JSON文档
2. 每个集合（collection）对应MySQL中的一个表
3. 微信云开发会自动生成 `_id` 字段，无需手动设置
4. 建议在导入前先备份云数据库中的数据
5. 如果数据量较大，建议分批导入

## 数据类型映射

| MySQL类型 | MongoDB类型 | 说明 |
|-----------|------------|------|
| INT | Number | 整数 |
| VARCHAR | String | 字符串 |
| TEXT | String | 长文本 |
| JSON | Object/Array | JSON对象或数组 |
| DATETIME | String | 日期时间字符串 |
| DECIMAL | Number | 小数 |

## 后续步骤

导入数据后，需要修改小程序代码，将数据库操作从MySQL改为微信云开发数据库。
"""
    
    # 保存说明文档
    instructions_file = EXPORT_DIR / "导入说明.md"
    with open(instructions_file, "w", encoding="utf-8") as f:
        f.write(instructions)
    
    print(f"导入说明文档已生成: {instructions_file}")


if __name__ == "__main__":
    print("=" * 50)
    print("MySQL数据导出到微信云开发数据库格式")
    print("=" * 50)
    
    # 导出所有表
    export_all_tables()
    
    # 生成导入说明
    generate_import_instructions()
    
    print("\n" + "=" * 50)
    print("导出完成！请查看 wechat_cloud_data 目录")
    print("=" * 50)