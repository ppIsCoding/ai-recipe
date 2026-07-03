-- 菜谱数据全面更新脚本
-- 基于《中国居民膳食指南2022》更新健康标签和营养数据

USE ai_recipe;

-- ========== 1. 更新每道菜的用油量、用盐量、膳食纤维 ==========

-- 番茄炒蛋 (炒菜，用油中等)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 1;

-- 红烧排骨 (炖菜，用油少，但盐较多)
UPDATE recipes SET 
    oil_per_serving = 8, 
    salt_per_serving = 2.5, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白"]'
WHERE id = 2;

-- 可乐鸡翅 (炒+炖，含糖)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 0,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 3;

-- 清炒时蔬 (素菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 5,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 4;

-- 红烧肉 (炖菜，油脂较高)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白"]'
WHERE id = 5;

-- 宫保鸡丁 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 6;

-- 蒜蓉西兰花 (素菜，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 6,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 7;

-- 青椒肉丝 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["轻烹饪"]'
WHERE id = 8;

-- 蛋炒饭 (炒饭，用油中等)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 9;

-- 酸辣土豆丝 (素菜，少油)
UPDATE recipes SET 
    oil_per_serving = 8, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 4,
    health_tags = '["轻烹饪"]'
WHERE id = 10;

-- 鱼香肉丝 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 11;

-- 麻婆豆腐 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 2,
    health_tags = '["轻烹饪"]'
WHERE id = 12;

-- 回锅肉 (炒菜，油脂较高)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 3,
    health_tags = '["轻烹饪"]'
WHERE id = 13;

-- 水煮鱼 (煮菜，用油较多)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 14;

-- 糖醋里脊 (炸+炒，用油较多)
UPDATE recipes SET 
    oil_per_serving = 20, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["轻烹饪"]'
WHERE id = 15;

-- 京酱肉丝 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 2,
    health_tags = '["轻烹饪"]'
WHERE id = 16;

-- 鱼香茄子 (炒菜，茄子吸油)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 4,
    health_tags = '["轻烹饪"]'
WHERE id = 17;

-- 干煸豆角 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 5,
    health_tags = '["轻烹饪"]'
WHERE id = 18;

-- 西红柿牛腩 (炖菜)
UPDATE recipes SET 
    oil_per_serving = 8, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 3,
    health_tags = '["高蛋白"]'
WHERE id = 19;

-- 清蒸鲈鱼 (蒸菜，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "少油", "轻烹饪"]'
WHERE id = 20;

-- 蒜蓉粉丝蒸虾 (蒸菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "少油", "轻烹饪"]'
WHERE id = 21;

-- 红烧茄子 (炒菜，茄子吸油)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 4,
    health_tags = '["轻烹饪"]'
WHERE id = 22;

-- 孜然羊肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 23;

-- 蚝油生菜 (焯水+淋油，少油)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 3,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 24;

-- 辣子鸡 (炒菜，用油较多)
UPDATE recipes SET 
    oil_per_serving = 18, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 25;

-- 葱爆羊肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 26;

-- 口水鸡 (凉拌，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "少油", "轻烹饪"]'
WHERE id = 27;

-- 西芹百合 (素菜，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 4,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 28;

-- 啤酒鸭 (炖菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白"]'
WHERE id = 29;

-- 香菇滑鸡 (蒸菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "少油", "轻烹饪"]'
WHERE id = 30;

-- 酸菜鱼 (煮菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 31;

-- 小炒黄牛肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 32;

-- 蒜苔炒肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 4,
    health_tags = '["轻烹饪"]'
WHERE id = 33;

-- 虎皮青椒 (素菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 3,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 34;

-- 农家小炒肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["轻烹饪"]'
WHERE id = 35;

-- 白灼虾 (焯水，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "少油", "少盐", "轻烹饪"]'
WHERE id = 36;

-- 地三鲜 (炒菜，用油较多)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 5,
    health_tags = '["轻烹饪"]'
WHERE id = 37;

-- 木须肉 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 38;

-- 酸辣汤 (汤类，少油)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["少油", "轻烹饪"]'
WHERE id = 39;

-- 番茄蛋汤 (汤类，少油)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "少油", "少盐", "轻烹饪"]'
WHERE id = 40;

-- 紫菜蛋花汤 (汤类，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 2, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "少油", "少盐", "轻烹饪"]'
WHERE id = 41;

-- 蛋黄焗南瓜 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 3,
    health_tags = '["轻烹饪"]'
WHERE id = 42;

-- 梅菜扣肉 (蒸菜，时间长)
UPDATE recipes SET 
    oil_per_serving = 15, 
    salt_per_serving = 2.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白"]'
WHERE id = 43;

-- 粉蒸肉 (蒸菜)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白"]'
WHERE id = 44;

-- 剁椒鱼头 (蒸菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 2.0, 
    fiber_per_serving = 1,
    health_tags = '["高蛋白", "少油", "轻烹饪"]'
WHERE id = 45;

-- 铁板牛肉 (煎菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 46;

-- 豆腐煲 (炖菜，少油)
UPDATE recipes SET 
    oil_per_serving = 5, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 2,
    health_tags = '["少油", "轻烹饪"]'
WHERE id = 47;

-- 蒜蓉粉丝蒸扇贝 (蒸菜，少油少盐)
UPDATE recipes SET 
    oil_per_serving = 3, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 1,
    health_tags = '["少油", "少盐", "轻烹饪"]'
WHERE id = 48;

-- 干锅花菜 (炒菜)
UPDATE recipes SET 
    oil_per_serving = 12, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 4,
    health_tags = '["轻烹饪"]'
WHERE id = 49;

-- 鸡蛋灌饼 (煎饼)
UPDATE recipes SET 
    oil_per_serving = 10, 
    salt_per_serving = 1.0, 
    fiber_per_serving = 2,
    health_tags = '["高蛋白", "轻烹饪"]'
WHERE id = 50;

-- 锅包肉 (炸+炒，用油较多)
UPDATE recipes SET 
    oil_per_serving = 20, 
    salt_per_serving = 1.5, 
    fiber_per_serving = 1,
    health_tags = '["轻烹饪"]'
WHERE id = 51;


-- ========== 2. 删除 time_minutes 字段 ==========

ALTER TABLE recipes DROP COLUMN IF EXISTS time_minutes;


-- ========== 3. 验证更新 ==========

SELECT 
    id, 
    name, 
    cook_time,
    oil_per_serving, 
    salt_per_serving, 
    fiber_per_serving, 
    health_tags 
FROM recipes 
ORDER BY id;

SELECT '菜谱数据更新完成！' AS message;
