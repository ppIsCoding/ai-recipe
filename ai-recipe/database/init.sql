-- 快手小厨 数据库初始化脚本
-- 基于《中国居民膳食指南2022》的健康菜谱推荐系统

CREATE DATABASE IF NOT EXISTS ai_recipe DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_recipe;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY COMMENT '微信openid',
    nickname VARCHAR(100) DEFAULT '' COMMENT '昵称',
    avatar_url TEXT COMMENT '头像URL',
    taste JSON COMMENT '口味偏好',
    avoid JSON COMMENT '忌口',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- 个人信息字段
    gender VARCHAR(10) COMMENT '性别: male/female',
    age INT COMMENT '年龄',
    height DECIMAL(5,1) COMMENT '身高(cm)',
    weight DECIMAL(5,1) COMMENT '体重(kg)',
    activity_level VARCHAR(20) DEFAULT 'sedentary' COMMENT '活动量: sedentary/light/moderate/active',
    health_goal VARCHAR(20) DEFAULT 'maintain' COMMENT '健康目标: lose_weight/maintain/gain_muscle'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 菜谱表
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '菜谱名称',
    description TEXT COMMENT '描述',
    difficulty VARCHAR(10) DEFAULT '简单' COMMENT '难度',
    cook_time VARCHAR(20) DEFAULT '' COMMENT '烹饪时间',
    servings VARCHAR(20) DEFAULT '' COMMENT '份量',
    main_ingredients JSON COMMENT '主要食材',
    ingredients JSON COMMENT '完整食材清单',
    steps JSON COMMENT '步骤',
    nutrition JSON COMMENT '营养成分',
    image_url TEXT COMMENT '图片URL',
    category VARCHAR(20) DEFAULT '家常菜' COMMENT '分类',
    -- 健康标签字段
    time_minutes INT DEFAULT 0 COMMENT '烹饪时间(分钟)',
    health_tags JSON COMMENT '健康标签: 少盐/少油/高蛋白/轻烹饪',
    oil_per_serving DECIMAL(5,1) DEFAULT 0 COMMENT '每份用油量(g)',
    salt_per_serving DECIMAL(5,1) DEFAULT 0 COMMENT '每份用盐量(g)',
    fiber_per_serving DECIMAL(5,1) DEFAULT 0 COMMENT '每份膳食纤维(g)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜谱表';

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    recipe_id INT NOT NULL COMMENT '菜谱ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_recipe (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 做菜历史表
CREATE TABLE IF NOT EXISTS cook_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    recipe_id INT NOT NULL COMMENT '菜谱ID',
    recipe_name VARCHAR(100) DEFAULT '' COMMENT '菜谱名称',
    cook_time INT DEFAULT 0 COMMENT '烹饪时长(分钟)',
    rating INT DEFAULT 5 COMMENT '评分(1-5)',
    note TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='做菜历史表';

-- 营养分析缓存表
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    foods_key VARCHAR(128) UNIQUE NOT NULL COMMENT '食材组合的hash key',
    foods JSON NOT NULL COMMENT '分析的食材列表',
    total_calories INT DEFAULT 0 COMMENT '总热量(kcal)',
    total_protein INT DEFAULT 0 COMMENT '总蛋白质(g)',
    total_fat INT DEFAULT 0 COMMENT '总脂肪(g)',
    total_carbs INT DEFAULT 0 COMMENT '总碳水(g)',
    health_advice TEXT COMMENT '健康建议',
    recommended_recipes JSON COMMENT '推荐做法',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_foods_key (foods_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营养分析缓存表';

-- 插入示例菜谱数据（基于《中国居民膳食指南2022》的健康轻烹饪菜谱）
INSERT INTO recipes (name, description, difficulty, cook_time, time_minutes, main_ingredients, ingredients, steps, nutrition, category, health_tags, oil_per_serving, salt_per_serving, fiber_per_serving) VALUES
('番茄炒蛋', '经典家常菜，酸甜可口', '简单', '15分钟', 15, 
 '["番茄", "西红柿", "鸡蛋"]', 
 '[{"name": "番茄", "amount": "2个"}, {"name": "鸡蛋", "amount": "3个"}]',
 '[{"step": 1, "desc": "番茄洗净切块，鸡蛋打散备用"}, {"step": 2, "desc": "热锅凉油，倒入蛋液滑散盛出"}, {"step": 3, "desc": "锅中放油，放入番茄翻炒出汁"}, {"step": 4, "desc": "加入鸡蛋翻炒均匀，调味即可"}]',
 '{"calories": 180, "protein": 12, "fat": 10, "carbs": 8}',
 '家常菜', '["少油", "高蛋白", "轻烹饪"]', 10, 1.5, 2),

('清炒西兰花', '低卡高纤维，健康首选', '简单', '10分钟', 10,
 '["西兰花", "蒜"]',
 '[{"name": "西兰花", "amount": "300g"}, {"name": "蒜", "amount": "3瓣"}]',
 '[{"step": 1, "desc": "西兰花切小朵，焯水30秒"}, {"step": 2, "desc": "热锅少油，爆香蒜末"}, {"step": 3, "desc": "放入西兰花翻炒，加盐调味即可"}]',
 '{"calories": 80, "protein": 5, "fat": 3, "carbs": 10}',
 '素菜', '["少油", "少盐", "轻烹饪"]', 5, 1.0, 6),

('鸡胸肉沙拉', '高蛋白低脂，健身必备', '简单', '20分钟', 20,
 '["鸡胸肉", "生菜", "黄瓜", "番茄"]',
 '[{"name": "鸡胸肉", "amount": "150g"}, {"name": "生菜", "amount": "100g"}, {"name": "黄瓜", "amount": "半根"}, {"name": "番茄", "amount": "1个"}]',
 '[{"step": 1, "desc": "鸡胸肉煮熟撕成丝"}, {"step": 2, "desc": "蔬菜洗净切好"}, {"step": 3, "desc": "混合所有食材，加少量沙拉酱"}]',
 '{"calories": 250, "protein": 30, "fat": 8, "carbs": 12}',
 '沙拉', '["高蛋白", "少油", "轻烹饪"]', 5, 1.0, 4),

('蒜蓉虾仁', '优质蛋白，少油健康', '简单', '15分钟', 15,
 '["虾仁", "蒜"]',
 '[{"name": "虾仁", "amount": "200g"}, {"name": "蒜", "amount": "5瓣"}]',
 '[{"step": 1, "desc": "虾仁洗净，蒜切末"}, {"step": 2, "desc": "热锅少油，爆香蒜末"}, {"step": 3, "desc": "放入虾仁翻炒至变色，调味即可"}]',
 '{"calories": 150, "protein": 25, "fat": 5, "carbs": 3}',
 '海鲜', '["高蛋白", "少油", "少盐", "轻烹饪"]', 8, 1.5, 1),

('蒸蛋羹', '嫩滑可口，老少皆宜', '简单', '15分钟', 15,
 '["鸡蛋"]',
 '[{"name": "鸡蛋", "amount": "2个"}, {"name": "温水", "amount": "200ml"}]',
 '[{"step": 1, "desc": "鸡蛋打散，加入温水搅匀"}, {"step": 2, "desc": "过滤蛋液，去除气泡"}, {"step": 3, "desc": "上锅蒸10分钟，淋少许酱油即可"}]',
 '{"calories": 120, "protein": 10, "fat": 8, "carbs": 2}',
 '家常菜', '["少油", "少盐", "高蛋白", "轻烹饪"]', 0, 1.0, 0),

('凉拌黄瓜', '清爽开胃，零油烟', '简单', '10分钟', 10,
 '["黄瓜", "蒜"]',
 '[{"name": "黄瓜", "amount": "2根"}, {"name": "蒜", "amount": "3瓣"}]',
 '[{"step": 1, "desc": "黄瓜拍碎切段"}, {"step": 2, "desc": "蒜切末，加入调料"}, {"step": 3, "desc": "拌匀即可食用"}]',
 '{"calories": 50, "protein": 2, "fat": 2, "carbs": 6}',
 '凉菜', '["少油", "少盐", "轻烹饪"]', 3, 1.0, 2),

('清蒸鲈鱼', '原汁原味，营养健康', '简单', '20分钟', 20,
 '["鲈鱼", "葱", "姜"]',
 '[{"name": "鲈鱼", "amount": "1条"}, {"name": "葱", "amount": "2根"}, {"name": "姜", "amount": "3片"}]',
 '[{"step": 1, "desc": "鲈鱼处理干净，划几刀"}, {"step": 2, "desc": "放上葱姜，上锅蒸8分钟"}, {"step": 3, "desc": "淋上蒸鱼豉油，泼热油即可"}]',
 '{"calories": 180, "protein": 25, "fat": 8, "carbs": 2}',
 '海鲜', '["高蛋白", "少油", "轻烹饪"]', 10, 1.5, 1),

('番茄牛腩', '营养丰富，暖胃佳品', '中等', '45分钟', 45,
 '["牛腩", "番茄"]',
 '[{"name": "牛腩", "amount": "300g"}, {"name": "番茄", "amount": "2个"}]',
 '[{"step": 1, "desc": "牛腩切块焯水"}, {"step": 2, "desc": "番茄切块"}, {"step": 3, "desc": "锅中加水，放入牛腩和番茄炖煮40分钟"}, {"step": 4, "desc": "调味即可"}]',
 '{"calories": 350, "protein": 28, "fat": 18, "carbs": 15}',
 '炖菜', '["高蛋白"]', 10, 2.0, 3);
