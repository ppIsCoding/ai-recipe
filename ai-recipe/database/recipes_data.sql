-- 菜谱数据初始化脚本（50道菜品）

USE ai_recipe;

-- 清空现有菜谱数据
TRUNCATE TABLE recipes;

-- 插入50道菜品数据
INSERT INTO recipes (name, description, difficulty, cook_time, servings, main_ingredients, ingredients, steps, nutrition, image_url, category) VALUES

-- 1. 番茄炒蛋
('番茄炒蛋', '经典家常菜，酸甜可口，营养丰富', '简单', '15分钟', '2人份',
 '["番茄", "西红柿", "鸡蛋"]',
 '[{"name": "番茄", "amount": "2个"}, {"name": "鸡蛋", "amount": "3个"}, {"name": "葱花", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "番茄洗净切块，鸡蛋打散备用"}, {"step": 2, "desc": "热锅凉油，倒入蛋液滑散盛出"}, {"step": 3, "desc": "锅中放油，放入番茄翻炒出汁"}, {"step": 4, "desc": "加入鸡蛋翻炒均匀，调味即可"}]',
 '{"calories": 180, "protein": 12, "fat": 10, "carbs": 8}',
 '/images/recipe/tomato-egg.jpg', '家常菜'),

-- 2. 红烧排骨
('红烧排骨', '色泽红亮，肉质鲜嫩，老少皆宜', '中等', '45分钟', '3人份',
 '["排骨", "猪排骨", "猪肉"]',
 '[{"name": "排骨", "amount": "500g"}, {"name": "生姜", "amount": "3片"}, {"name": "八角", "amount": "2个"}, {"name": "酱油", "amount": "2勺"}]',
 '[{"step": 1, "desc": "排骨焯水去血沫"}, {"step": 2, "desc": "炒糖色，放入排骨上色"}, {"step": 3, "desc": "加入调料和热水，小火炖30分钟"}, {"step": 4, "desc": "大火收汁即可"}]',
 '{"calories": 350, "protein": 25, "fat": 20, "carbs": 15}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 3. 可乐鸡翅
('可乐鸡翅', '甜香可口，孩子最爱的美味', '简单', '30分钟', '2人份',
 '["鸡翅", "鸡翅中", "鸡肉"]',
 '[{"name": "鸡翅", "amount": "10个"}, {"name": "可乐", "amount": "1罐"}, {"name": "生姜", "amount": "2片"}, {"name": "酱油", "amount": "1勺"}]',
 '[{"step": 1, "desc": "鸡翅焯水备用"}, {"step": 2, "desc": "煎至两面金黄"}, {"step": 3, "desc": "倒入可乐和调料，炖15分钟"}, {"step": 4, "desc": "大火收汁即可"}]',
 '{"calories": 250, "protein": 18, "fat": 12, "carbs": 15}',
 '/images/recipe/cola-wings.jpg', '家常菜'),

-- 4. 清炒时蔬
('清炒时蔬', '清淡爽口，保留蔬菜原汁原味', '简单', '10分钟', '2人份',
 '["蔬菜", "青菜", "白菜", "菠菜", "油菜", "生菜"]',
 '[{"name": "时令蔬菜", "amount": "300克"}, {"name": "蒜末", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "蔬菜洗净切段"}, {"step": 2, "desc": "热锅爆香蒜末"}, {"step": 3, "desc": "放入蔬菜大火快炒"}, {"step": 4, "desc": "调味出锅"}]',
 '{"calories": 80, "protein": 3, "fat": 5, "carbs": 6}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 5. 红烧肉
('红烧肉', '肥而不腻，入口即化的经典美味', '中等', '60分钟', '3人份',
 '["五花肉", "猪肉"]',
 '[{"name": "五花肉", "amount": "500g"}, {"name": "生姜", "amount": "3片"}, {"name": "八角", "amount": "2个"}, {"name": "冰糖", "amount": "适量"}]',
 '[{"step": 1, "desc": "五花肉切块焯水"}, {"step": 2, "desc": "炒糖色，放入肉块上色"}, {"step": 3, "desc": "加入调料和热水，小火炖45分钟"}, {"step": 4, "desc": "大火收汁即可"}]',
 '{"calories": 450, "protein": 20, "fat": 35, "carbs": 10}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 6. 宫保鸡丁
('宫保鸡丁', '麻辣鲜香，下饭神器', '中等', '20分钟', '2人份',
 '["鸡肉", "鸡胸肉", "花生"]',
 '[{"name": "鸡胸肉", "amount": "300g"}, {"name": "花生米", "amount": "50g"}, {"name": "干辣椒", "amount": "适量"}, {"name": "花椒", "amount": "适量"}]',
 '[{"step": 1, "desc": "鸡肉切丁腌制"}, {"step": 2, "desc": "花生米炸熟备用"}, {"step": 3, "desc": "爆香辣椒和花椒，放入鸡丁翻炒"}, {"step": 4, "desc": "加入花生米和调料翻炒均匀"}]',
 '{"calories": 280, "protein": 22, "fat": 15, "carbs": 12}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 7. 蒜蓉西兰花
('蒜蓉西兰花', '健康美味，营养丰富', '简单', '10分钟', '2人份',
 '["西兰花", "花菜"]',
 '[{"name": "西兰花", "amount": "1颗"}, {"name": "蒜末", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "西兰花掰成小朵，焯水备用"}, {"step": 2, "desc": "热锅爆香蒜末"}, {"step": 3, "desc": "放入西兰花翻炒"}, {"step": 4, "desc": "调味出锅"}]',
 '{"calories": 60, "protein": 4, "fat": 3, "carbs": 5}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 8. 青椒肉丝
('青椒肉丝', '家常快手菜，下饭必备', '简单', '15分钟', '2人份',
 '["青椒", "辣椒", "猪肉", "肉"]',
 '[{"name": "青椒", "amount": "2个"}, {"name": "猪肉", "amount": "200g"}, {"name": "生抽", "amount": "1勺"}, {"name": "淀粉", "amount": "适量"}]',
 '[{"step": 1, "desc": "猪肉切丝，用生抽和淀粉腌制"}, {"step": 2, "desc": "青椒切丝"}, {"step": 3, "desc": "热锅滑炒肉丝至变色盛出"}, {"step": 4, "desc": "炒青椒，加入肉丝翻炒均匀"}]',
 '{"calories": 200, "protein": 15, "fat": 12, "carbs": 8}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 9. 蛋炒饭
('蛋炒饭', '简单美味，剩饭的完美变身', '简单', '10分钟', '1人份',
 '["米饭", "饭", "鸡蛋"]',
 '[{"name": "剩米饭", "amount": "1碗"}, {"name": "鸡蛋", "amount": "2个"}, {"name": "葱花", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "鸡蛋打散，米饭弄散"}, {"step": 2, "desc": "热锅凉油，倒入蛋液"}, {"step": 3, "desc": "蛋液半凝固时加入米饭翻炒"}, {"step": 4, "desc": "加入葱花和盐调味"}]',
 '{"calories": 300, "protein": 10, "fat": 15, "carbs": 35}',
 '/images/recipe/tomato-egg.jpg', '主食'),

-- 10. 酸辣土豆丝
('酸辣土豆丝', '酸辣开胃，经典家常菜', '简单', '15分钟', '2人份',
 '["土豆", "马铃薯"]',
 '[{"name": "土豆", "amount": "2个"}, {"name": "干辣椒", "amount": "适量"}, {"name": "醋", "amount": "2勺"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "土豆去皮切丝，泡水去淀粉"}, {"step": 2, "desc": "热锅爆香干辣椒"}, {"step": 3, "desc": "放入土豆丝大火翻炒"}, {"step": 4, "desc": "加入醋和盐调味"}]',
 '{"calories": 120, "protein": 3, "fat": 5, "carbs": 18}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 11. 鱼香肉丝
('鱼香肉丝', '酸甜微辣，经典川菜', '中等', '20分钟', '2人份',
 '["猪肉", "木耳", "胡萝卜", "青椒"]',
 '[{"name": "猪肉", "amount": "200g"}, {"name": "木耳", "amount": "适量"}, {"name": "胡萝卜", "amount": "1根"}, {"name": "青椒", "amount": "1个"}]',
 '[{"step": 1, "desc": "猪肉切丝腌制"}, {"step": 2, "desc": "木耳、胡萝卜、青椒切丝"}, {"step": 3, "desc": "调制鱼香汁"}, {"step": 4, "desc": "爆炒肉丝，加入配菜和鱼香汁翻炒"}]',
 '{"calories": 220, "protein": 18, "fat": 12, "carbs": 10}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 12. 麻婆豆腐
('麻婆豆腐', '麻辣鲜香，下饭神器', '简单', '15分钟', '2人份',
 '["豆腐", "猪肉", "牛肉"]',
 '[{"name": "豆腐", "amount": "1块"}, {"name": "猪肉末", "amount": "100g"}, {"name": "豆瓣酱", "amount": "1勺"}, {"name": "花椒粉", "amount": "适量"}]',
 '[{"step": 1, "desc": "豆腐切块焯水"}, {"step": 2, "desc": "炒肉末和豆瓣酱"}, {"step": 3, "desc": "加入豆腐和水烧开"}, {"step": 4, "desc": "勾芡撒花椒粉出锅"}]',
 '{"calories": 180, "protein": 12, "fat": 10, "carbs": 8}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 13. 回锅肉
('回锅肉', '肥而不腻，川菜经典', '中等', '20分钟', '2人份',
 '["五花肉", "猪肉", "青椒", "蒜苗"]',
 '[{"name": "五花肉", "amount": "300g"}, {"name": "青椒", "amount": "2个"}, {"name": "蒜苗", "amount": "适量"}, {"name": "豆瓣酱", "amount": "1勺"}]',
 '[{"step": 1, "desc": "五花肉煮熟切片"}, {"step": 2, "desc": "煸炒肉片至出油"}, {"step": 3, "desc": "加入豆瓣酱炒出红油"}, {"step": 4, "desc": "加入青椒蒜苗翻炒均匀"}]',
 '{"calories": 380, "protein": 15, "fat": 30, "carbs": 5}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 14. 水煮鱼
('水煮鱼', '麻辣鲜香，鱼肉嫩滑', '中等', '30分钟', '3人份',
 '["鱼", "草鱼", "鲈鱼", "豆芽"]',
 '[{"name": "鱼片", "amount": "300g"}, {"name": "豆芽", "amount": "200g"}, {"name": "干辣椒", "amount": "适量"}, {"name": "花椒", "amount": "适量"}]',
 '[{"step": 1, "desc": "鱼片腌制"}, {"step": 2, "desc": "豆芽焯水铺底"}, {"step": 3, "desc": "鱼片煮熟铺在豆芽上"}, {"step": 4, "desc": "浇上热油和辣椒花椒"}]',
 '{"calories": 250, "protein": 25, "fat": 12, "carbs": 8}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 15. 糖醋里脊
('糖醋里脊', '酸甜可口，外酥里嫩', '中等', '25分钟', '2人份',
 '["猪里脊", "猪肉"]',
 '[{"name": "猪里脊", "amount": "300g"}, {"name": "淀粉", "amount": "适量"}, {"name": "醋", "amount": "2勺"}, {"name": "糖", "amount": "2勺"}]',
 '[{"step": 1, "desc": "里脊切条腌制"}, {"step": 2, "desc": "裹淀粉炸至金黄"}, {"step": 3, "desc": "调制糖醋汁"}, {"step": 4, "desc": "翻炒均匀即可"}]',
 '{"calories": 320, "protein": 20, "fat": 18, "carbs": 20}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 16. 京酱肉丝
('京酱肉丝', '酱香浓郁，搭配豆腐皮', '简单', '15分钟', '2人份',
 '["猪肉", "豆腐皮"]',
 '[{"name": "猪肉", "amount": "200g"}, {"name": "豆腐皮", "amount": "2张"}, {"name": "甜面酱", "amount": "2勺"}, {"name": "葱丝", "amount": "适量"}]',
 '[{"step": 1, "desc": "猪肉切丝腌制"}, {"step": 2, "desc": "炒肉丝至变色"}, {"step": 3, "desc": "加入甜面酱翻炒"}, {"step": 4, "desc": "搭配豆腐皮和葱丝食用"}]',
 '{"calories": 250, "protein": 18, "fat": 15, "carbs": 10}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 17. 鱼香茄子
('鱼香茄子', '软糯入味，下饭神器', '简单', '20分钟', '2人份',
 '["茄子", "猪肉"]',
 '[{"name": "茄子", "amount": "2根"}, {"name": "猪肉末", "amount": "100g"}, {"name": "豆瓣酱", "amount": "1勺"}, {"name": "蒜末", "amount": "适量"}]',
 '[{"step": 1, "desc": "茄子切条炸软"}, {"step": 2, "desc": "炒肉末和豆瓣酱"}, {"step": 3, "desc": "加入茄子翻炒"}, {"step": 4, "desc": "调味出锅"}]',
 '{"calories": 200, "protein": 8, "fat": 12, "carbs": 15}',
 '/images/recipe/vegetables.jpg', '家常菜'),

-- 18. 干煸豆角
('干煸豆角', '干香酥脆，下饭美味', '简单', '15分钟', '2人份',
 '["豆角", "四季豆"]',
 '[{"name": "豆角", "amount": "300g"}, {"name": "猪肉末", "amount": "100g"}, {"name": "干辣椒", "amount": "适量"}, {"name": "花椒", "amount": "适量"}]',
 '[{"step": 1, "desc": "豆角切段炸至表皮起皱"}, {"step": 2, "desc": "炒肉末和辣椒花椒"}, {"step": 3, "desc": "加入豆角翻炒"}, {"step": 4, "desc": "调味出锅"}]',
 '{"calories": 150, "protein": 8, "fat": 8, "carbs": 12}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 19. 西红柿牛腩
('西红柿牛腩', '酸甜浓郁，营养丰富', '中等', '60分钟', '3人份',
 '["牛肉", "牛腩", "番茄", "西红柿"]',
 '[{"name": "牛腩", "amount": "500g"}, {"name": "番茄", "amount": "3个"}, {"name": "生姜", "amount": "3片"}, {"name": "八角", "amount": "2个"}]',
 '[{"step": 1, "desc": "牛腩焯水切块"}, {"step": 2, "desc": "番茄炒出汁"}, {"step": 3, "desc": "加入牛腩和调料炖煮"}, {"step": 4, "desc": "炖至软烂即可"}]',
 '{"calories": 350, "protein": 30, "fat": 15, "carbs": 10}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 20. 清蒸鲈鱼
('清蒸鲈鱼', '鲜嫩可口，保留鱼的原味', '简单', '20分钟', '2人份',
 '["鱼", "鲈鱼"]',
 '[{"name": "鲈鱼", "amount": "1条"}, {"name": "葱姜", "amount": "适量"}, {"name": "蒸鱼豉油", "amount": "2勺"}, {"name": "料酒", "amount": "1勺"}]',
 '[{"step": 1, "desc": "鲈鱼处理干净，划几刀"}, {"step": 2, "desc": "放葱姜料酒腌制"}, {"step": 3, "desc": "水开后蒸8-10分钟"}, {"step": 4, "desc": "淋上蒸鱼豉油，浇热油"}]',
 '{"calories": 150, "protein": 25, "fat": 5, "carbs": 2}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 21. 蒜蓉粉丝蒸虾
('蒜蓉粉丝蒸虾', '鲜美可口，蒜香浓郁', '简单', '15分钟', '2人份',
 '["虾", "大虾", "粉丝"]',
 '[{"name": "大虾", "amount": "10只"}, {"name": "粉丝", "amount": "1把"}, {"name": "蒜末", "amount": "适量"}, {"name": "生抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "粉丝泡软铺底"}, {"step": 2, "desc": "虾开背去虾线"}, {"step": 3, "desc": "放上蒜末和调料"}, {"step": 4, "desc": "水开后蒸8分钟"}]',
 '{"calories": 180, "protein": 20, "fat": 5, "carbs": 15}',
 '/images/recipe/kung-pao-chicken.jpg', '海鲜'),

-- 22. 红烧茄子
('红烧茄子', '软糯入味，家常美味', '简单', '15分钟', '2人份',
 '["茄子"]',
 '[{"name": "茄子", "amount": "2根"}, {"name": "蒜末", "amount": "适量"}, {"name": "生抽", "amount": "1勺"}, {"name": "糖", "amount": "少许"}]',
 '[{"step": 1, "desc": "茄子切块"}, {"step": 2, "desc": "热油煸炒茄子"}, {"step": 3, "desc": "加入调料和少许水"}, {"step": 4, "desc": "烧至入味收汁"}]',
 '{"calories": 120, "protein": 3, "fat": 8, "carbs": 10}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 23. 孜然羊肉
('孜然羊肉', '香气扑鼻，新疆风味', '中等', '20分钟', '2人份',
 '["羊肉"]',
 '[{"name": "羊肉", "amount": "300g"}, {"name": "孜然", "amount": "适量"}, {"name": "辣椒粉", "amount": "适量"}, {"name": "洋葱", "amount": "半个"}]',
 '[{"step": 1, "desc": "羊肉切片腌制"}, {"step": 2, "desc": "大火爆炒羊肉"}, {"step": 3, "desc": "加入孜然和辣椒粉"}, {"step": 4, "desc": "加入洋葱翻炒均匀"}]',
 '{"calories": 280, "protein": 22, "fat": 18, "carbs": 5}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 24. 蚝油生菜
('蚝油生菜', '清脆爽口，简单快手', '简单', '5分钟', '2人份',
 '["生菜", "蔬菜"]',
 '[{"name": "生菜", "amount": "1颗"}, {"name": "蚝油", "amount": "1勺"}, {"name": "蒜末", "amount": "适量"}]',
 '[{"step": 1, "desc": "生菜洗净"}, {"step": 2, "desc": "焯水摆盘"}, {"step": 3, "desc": "热油爆香蒜末"}, {"step": 4, "desc": "加入蚝油调味淋上"}]',
 '{"calories": 50, "protein": 2, "fat": 3, "carbs": 4}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 25. 辣子鸡
('辣子鸡', '麻辣酥香，重庆特色', '中等', '25分钟', '2人份',
 '["鸡肉", "鸡腿"]',
 '[{"name": "鸡腿", "amount": "2个"}, {"name": "干辣椒", "amount": "大量"}, {"name": "花椒", "amount": "适量"}, {"name": "芝麻", "amount": "适量"}]',
 '[{"step": 1, "desc": "鸡肉切块炸至金黄"}, {"step": 2, "desc": "大量干辣椒花椒炒香"}, {"step": 3, "desc": "加入鸡块翻炒"}, {"step": 4, "desc": "撒芝麻出锅"}]',
 '{"calories": 300, "protein": 20, "fat": 20, "carbs": 8}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 26. 葱爆羊肉
('葱爆羊肉', '葱香浓郁，羊肉鲜嫩', '简单', '15分钟', '2人份',
 '["羊肉", "大葱"]',
 '[{"name": "羊肉", "amount": "300g"}, {"name": "大葱", "amount": "2根"}, {"name": "生抽", "amount": "1勺"}, {"name": "料酒", "amount": "1勺"}]',
 '[{"step": 1, "desc": "羊肉切片腌制"}, {"step": 2, "desc": "大葱切段"}, {"step": 3, "desc": "大火爆炒羊肉"}, {"step": 4, "desc": "加入大葱翻炒均匀"}]',
 '{"calories": 250, "protein": 20, "fat": 15, "carbs": 5}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 27. 口水鸡
('口水鸡', '麻辣鲜香，川菜凉菜', '中等', '30分钟', '2人份',
 '["鸡肉", "鸡腿"]',
 '[{"name": "鸡腿", "amount": "2个"}, {"name": "辣椒油", "amount": "2勺"}, {"name": "花椒粉", "amount": "适量"}, {"name": "花生碎", "amount": "适量"}]',
 '[{"step": 1, "desc": "鸡腿煮熟过冷水"}, {"step": 2, "desc": "切块摆盘"}, {"step": 3, "desc": "调制麻辣酱汁"}, {"step": 4, "desc": "淋上酱汁撒花生碎"}]',
 '{"calories": 220, "protein": 18, "fat": 12, "carbs": 5}',
 '/images/recipe/kung-pao-chicken.jpg', '凉菜'),

-- 28. 西芹百合
('西芹百合', '清淡爽口，营养健康', '简单', '10分钟', '2人份',
 '["芹菜", "西芹", "百合"]',
 '[{"name": "西芹", "amount": "200g"}, {"name": "百合", "amount": "1个"}, {"name": "枸杞", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "西芹切段，百合掰开"}, {"step": 2, "desc": "焯水备用"}, {"step": 3, "desc": "热油翻炒"}, {"step": 4, "desc": "加入枸杞调味出锅"}]',
 '{"calories": 60, "protein": 3, "fat": 2, "carbs": 8}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 29. 啤酒鸭
('啤酒鸭', '香气浓郁，鸭肉软烂', '中等', '45分钟', '3人份',
 '["鸭肉", "鸭子"]',
 '[{"name": "鸭肉", "amount": "500g"}, {"name": "啤酒", "amount": "1罐"}, {"name": "生姜", "amount": "3片"}, {"name": "八角", "amount": "2个"}]',
 '[{"step": 1, "desc": "鸭肉焯水切块"}, {"step": 2, "desc": "煸炒鸭肉出油"}, {"step": 3, "desc": "加入啤酒和调料炖煮"}, {"step": 4, "desc": "炖至软烂收汁"}]',
 '{"calories": 320, "protein": 22, "fat": 20, "carbs": 8}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 30. 香菇滑鸡
('香菇滑鸡', '鲜嫩多汁，营养丰富', '简单', '25分钟', '2人份',
 '["鸡肉", "香菇"]',
 '[{"name": "鸡腿", "amount": "2个"}, {"name": "香菇", "amount": "6朵"}, {"name": "生抽", "amount": "1勺"}, {"name": "淀粉", "amount": "适量"}]',
 '[{"step": 1, "desc": "鸡肉切块腌制"}, {"step": 2, "desc": "香菇切片"}, {"step": 3, "desc": "摆盘蒸15分钟"}, {"step": 4, "desc": "淋上酱汁即可"}]',
 '{"calories": 200, "protein": 18, "fat": 10, "carbs": 5}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 31. 酸菜鱼
('酸菜鱼', '酸辣开胃，鱼肉鲜嫩', '中等', '30分钟', '3人份',
 '["鱼", "草鱼", "酸菜"]',
 '[{"name": "鱼片", "amount": "300g"}, {"name": "酸菜", "amount": "200g"}, {"name": "泡椒", "amount": "适量"}, {"name": "花椒", "amount": "适量"}]',
 '[{"step": 1, "desc": "鱼片腌制"}, {"step": 2, "desc": "酸菜炒香"}, {"step": 3, "desc": "加入水和鱼片煮熟"}, {"step": 4, "desc": "浇上热油即可"}]',
 '{"calories": 200, "protein": 22, "fat": 8, "carbs": 5}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 32. 小炒黄牛肉
('小炒黄牛肉', '鲜嫩可口，湖南特色', '中等', '15分钟', '2人份',
 '["牛肉", "黄牛肉"]',
 '[{"name": "黄牛肉", "amount": "300g"}, {"name": "青椒", "amount": "2个"}, {"name": "小米辣", "amount": "适量"}, {"name": "蒜末", "amount": "适量"}]',
 '[{"step": 1, "desc": "牛肉切片腌制"}, {"step": 2, "desc": "大火爆炒牛肉"}, {"step": 3, "desc": "加入辣椒蒜末"}, {"step": 4, "desc": "翻炒均匀出锅"}]',
 '{"calories": 250, "protein": 25, "fat": 12, "carbs": 5}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 33. 蒜苔炒肉
('蒜苔炒肉', '清脆爽口，家常快手菜', '简单', '10分钟', '2人份',
 '["蒜苔", "猪肉"]',
 '[{"name": "蒜苔", "amount": "200g"}, {"name": "猪肉", "amount": "150g"}, {"name": "生抽", "amount": "1勺"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "蒜苔切段，猪肉切片"}, {"step": 2, "desc": "炒肉片至变色"}, {"step": 3, "desc": "加入蒜苔翻炒"}, {"step": 4, "desc": "调味出锅"}]',
 '{"calories": 180, "protein": 12, "fat": 10, "carbs": 8}',
 '/images/recipe/vegetables.jpg', '家常菜'),

-- 34. 虎皮青椒
('虎皮青椒', '微辣开胃，简单美味', '简单', '10分钟', '2人份',
 '["青椒", "辣椒"]',
 '[{"name": "青椒", "amount": "6个"}, {"name": "蒜末", "amount": "适量"}, {"name": "醋", "amount": "1勺"}, {"name": "生抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "青椒去籽"}, {"step": 2, "desc": "干煸至表皮起皱"}, {"step": 3, "desc": "加入蒜末和调料"}, {"step": 4, "desc": "翻炒均匀出锅"}]',
 '{"calories": 60, "protein": 2, "fat": 3, "carbs": 6}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 35. 农家小炒肉
('农家小炒肉', '香辣下饭，湖南家常菜', '简单', '15分钟', '2人份',
 '["五花肉", "青椒"]',
 '[{"name": "五花肉", "amount": "200g"}, {"name": "青椒", "amount": "3个"}, {"name": "蒜末", "amount": "适量"}, {"name": "豆豉", "amount": "适量"}]',
 '[{"step": 1, "desc": "五花肉切片"}, {"step": 2, "desc": "煸炒出油"}, {"step": 3, "desc": "加入青椒和豆豉"}, {"step": 4, "desc": "翻炒均匀出锅"}]',
 '{"calories": 280, "protein": 12, "fat": 22, "carbs": 5}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 36. 白灼虾
('白灼虾', '鲜甜可口，保留虾的原味', '简单', '10分钟', '2人份',
 '["虾", "大虾"]',
 '[{"name": "大虾", "amount": "500g"}, {"name": "姜片", "amount": "适量"}, {"name": "料酒", "amount": "1勺"}, {"name": "蘸料", "amount": "适量"}]',
 '[{"step": 1, "desc": "虾去虾线"}, {"step": 2, "desc": "水开后放入姜片料酒"}, {"step": 3, "desc": "放入虾煮至变红"}, {"step": 4, "desc": "捞出蘸料食用"}]',
 '{"calories": 120, "protein": 20, "fat": 2, "carbs": 2}',
 '/images/recipe/kung-pao-chicken.jpg', '海鲜'),

-- 37. 地三鲜
('地三鲜', '东北经典家常菜', '简单', '15分钟', '2人份',
 '["茄子", "土豆", "青椒"]',
 '[{"name": "茄子", "amount": "1根"}, {"name": "土豆", "amount": "1个"}, {"name": "青椒", "amount": "2个"}, {"name": "蒜末", "amount": "适量"}]',
 '[{"step": 1, "desc": "茄子土豆切块"}, {"step": 2, "desc": "分别炸至金黄"}, {"step": 3, "desc": "爆香蒜末"}, {"step": 4, "desc": "加入食材和调料翻炒"}]',
 '{"calories": 180, "protein": 5, "fat": 10, "carbs": 18}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 38. 木须肉
('木须肉', '营养均衡，色彩丰富', '简单', '15分钟', '2人份',
 '["猪肉", "鸡蛋", "木耳", "黄瓜"]',
 '[{"name": "猪肉", "amount": "150g"}, {"name": "鸡蛋", "amount": "2个"}, {"name": "木耳", "amount": "适量"}, {"name": "黄瓜", "amount": "1根"}]',
 '[{"step": 1, "desc": "猪肉切片腌制"}, {"step": 2, "desc": "鸡蛋炒散"}, {"step": 3, "desc": "炒肉片和配菜"}, {"step": 4, "desc": "加入鸡蛋翻炒均匀"}]',
 '{"calories": 200, "protein": 15, "fat": 12, "carbs": 8}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 39. 酸辣汤
('酸辣汤', '开胃暖身，酸辣可口', '简单', '15分钟', '2人份',
 '["豆腐", "鸡蛋", "木耳"]',
 '[{"name": "豆腐", "amount": "1块"}, {"name": "鸡蛋", "amount": "1个"}, {"name": "木耳", "amount": "适量"}, {"name": "醋", "amount": "2勺"}]',
 '[{"step": 1, "desc": "豆腐木耳切丝"}, {"step": 2, "desc": "煮开后加入食材"}, {"step": 3, "desc": "打入蛋花"}, {"step": 4, "desc": "加入醋和胡椒粉调味"}]',
 '{"calories": 100, "protein": 8, "fat": 5, "carbs": 8}',
 '/images/recipe/vegetables.jpg', '汤类'),

-- 40. 番茄蛋汤
('番茄蛋汤', '简单快手，营养美味', '简单', '10分钟', '2人份',
 '["番茄", "西红柿", "鸡蛋"]',
 '[{"name": "番茄", "amount": "2个"}, {"name": "鸡蛋", "amount": "2个"}, {"name": "葱花", "amount": "适量"}, {"name": "盐", "amount": "适量"}]',
 '[{"step": 1, "desc": "番茄切块"}, {"step": 2, "desc": "炒出汁后加水煮开"}, {"step": 3, "desc": "打入蛋花"}, {"step": 4, "desc": "调味撒葱花"}]',
 '{"calories": 80, "protein": 6, "fat": 4, "carbs": 5}',
 '/images/recipe/tomato-egg.jpg', '汤类'),

-- 41. 紫菜蛋花汤
('紫菜蛋花汤', '清淡可口，简单快手', '简单', '5分钟', '2人份',
 '["紫菜", "鸡蛋"]',
 '[{"name": "紫菜", "amount": "适量"}, {"name": "鸡蛋", "amount": "1个"}, {"name": "虾皮", "amount": "适量"}, {"name": "香油", "amount": "少许"}]',
 '[{"step": 1, "desc": "水开后放入紫菜"}, {"step": 2, "desc": "打入蛋花"}, {"step": 3, "desc": "加入虾皮"}, {"step": 4, "desc": "淋香油调味"}]',
 '{"calories": 50, "protein": 4, "fat": 3, "carbs": 2}',
 '/images/recipe/vegetables.jpg', '汤类'),

-- 42. 蛋黄焗南瓜
('蛋黄焗南瓜', '咸香软糯，创意菜品', '中等', '20分钟', '2人份',
 '["南瓜", "咸蛋黄"]',
 '[{"name": "南瓜", "amount": "300g"}, {"name": "咸蛋黄", "amount": "3个"}, {"name": "淀粉", "amount": "适量"}]',
 '[{"step": 1, "desc": "南瓜切条蒸熟"}, {"step": 2, "desc": "咸蛋黄碾碎"}, {"step": 3, "desc": "南瓜裹淀粉炸至金黄"}, {"step": 4, "desc": "翻炒蛋黄裹匀南瓜"}]',
 '{"calories": 200, "protein": 5, "fat": 10, "carbs": 25}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 43. 梅菜扣肉
('梅菜扣肉', '肥而不腻，客家名菜', '困难', '90分钟', '4人份',
 '["五花肉", "梅菜"]',
 '[{"name": "五花肉", "amount": "500g"}, {"name": "梅菜", "amount": "100g"}, {"name": "生抽", "amount": "2勺"}, {"name": "老抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "五花肉煮熟切片"}, {"step": 2, "desc": "梅菜泡软切碎"}, {"step": 3, "desc": "摆盘蒸60分钟"}, {"step": 4, "desc": "倒扣出锅"}]',
 '{"calories": 450, "protein": 15, "fat": 35, "carbs": 10}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 44. 粉蒸肉
('粉蒸肉', '软糯入味，湖北特色', '中等', '60分钟', '3人份',
 '["五花肉", "米粉"]',
 '[{"name": "五花肉", "amount": "400g"}, {"name": "蒸肉粉", "amount": "100g"}, {"name": "红薯", "amount": "1个"}, {"name": "生抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "五花肉切片腌制"}, {"step": 2, "desc": "裹上蒸肉粉"}, {"step": 3, "desc": "红薯铺底"}, {"step": 4, "desc": "蒸60分钟即可"}]',
 '{"calories": 400, "protein": 18, "fat": 28, "carbs": 20}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 45. 剁椒鱼头
('剁椒鱼头', '鲜辣可口，湖南名菜', '中等', '25分钟', '3人份',
 '["鱼头", "鲢鱼头"]',
 '[{"name": "鱼头", "amount": "1个"}, {"name": "剁椒", "amount": "适量"}, {"name": "姜蒜", "amount": "适量"}, {"name": "料酒", "amount": "1勺"}]',
 '[{"step": 1, "desc": "鱼头处理干净"}, {"step": 2, "desc": "铺上剁椒和姜蒜"}, {"step": 3, "desc": "蒸15分钟"}, {"step": 4, "desc": "浇热油即可"}]',
 '{"calories": 180, "protein": 25, "fat": 8, "carbs": 2}',
 '/images/recipe/kung-pao-chicken.jpg', '家常菜'),

-- 46. 铁板牛肉
('铁板牛肉', '香气扑鼻，滋滋作响', '中等', '15分钟', '2人份',
 '["牛肉"]',
 '[{"name": "牛肉", "amount": "300g"}, {"name": "洋葱", "amount": "半个"}, {"name": "黑胡椒", "amount": "适量"}, {"name": "黄油", "amount": "适量"}]',
 '[{"step": 1, "desc": "牛肉切片腌制"}, {"step": 2, "desc": "铁板烧热"}, {"step": 3, "desc": "煎牛肉和洋葱"}, {"step": 4, "desc": "撒黑胡椒即可"}]',
 '{"calories": 280, "protein": 25, "fat": 15, "carbs": 5}',
 '/images/recipe/ribs.jpg', '家常菜'),

-- 47. 豆腐煲
('豆腐煲', '暖胃营养，家常美味', '简单', '20分钟', '2人份',
 '["豆腐", "猪肉"]',
 '[{"name": "豆腐", "amount": "1块"}, {"name": "猪肉末", "amount": "100g"}, {"name": "香菇", "amount": "3朵"}, {"name": "生抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "豆腐切块"}, {"step": 2, "desc": "炒肉末和香菇"}, {"step": 3, "desc": "加入豆腐和调料"}, {"step": 4, "desc": "小火炖10分钟"}]',
 '{"calories": 150, "protein": 12, "fat": 8, "carbs": 5}',
 '/images/recipe/braised-pork.jpg', '家常菜'),

-- 48. 蒜蓉粉丝蒸扇贝
('蒜蓉粉丝蒸扇贝', '鲜美可口，宴客佳品', '简单', '15分钟', '2人份',
 '["扇贝", "粉丝"]',
 '[{"name": "扇贝", "amount": "6个"}, {"name": "粉丝", "amount": "1把"}, {"name": "蒜末", "amount": "适量"}, {"name": "生抽", "amount": "1勺"}]',
 '[{"step": 1, "desc": "粉丝泡软"}, {"step": 2, "desc": "扇贝处理干净"}, {"step": 3, "desc": "放上蒜末和调料"}, {"step": 4, "desc": "蒸8分钟即可"}]',
 '{"calories": 120, "protein": 15, "fat": 3, "carbs": 10}',
 '/images/recipe/kung-pao-chicken.jpg', '海鲜'),

-- 49. 干锅花菜
('干锅花菜', '干香酥脆，下饭美味', '简单', '15分钟', '2人份',
 '["花菜", "花椰菜"]',
 '[{"name": "花菜", "amount": "300g"}, {"name": "五花肉", "amount": "100g"}, {"name": "干辣椒", "amount": "适量"}, {"name": "蒜末", "amount": "适量"}]',
 '[{"step": 1, "desc": "花菜掰小朵"}, {"step": 2, "desc": "煸炒五花肉出油"}, {"step": 3, "desc": "加入花菜翻炒"}, {"step": 4, "desc": "加入辣椒蒜末调味"}]',
 '{"calories": 150, "protein": 8, "fat": 10, "carbs": 8}',
 '/images/recipe/vegetables.jpg', '素菜'),

-- 50. 鸡蛋灌饼
('鸡蛋灌饼', '早餐经典，简单美味', '简单', '10分钟', '1人份',
 '["鸡蛋", "面粉"]',
 '[{"name": "面粉", "amount": "200g"}, {"name": "鸡蛋", "amount": "2个"}, {"name": "葱花", "amount": "适量"}, {"name": "甜面酱", "amount": "适量"}]',
 '[{"step": 1, "desc": "面粉和成面团"}, {"step": 2, "desc": "擀成薄饼"}, {"step": 3, "desc": "打入鸡蛋摊匀"}, {"step": 4, "desc": "煎至两面金黄"}]',
 '{"calories": 250, "protein": 10, "fat": 12, "carbs": 28}',
 '/images/recipe/tomato-egg.jpg', '主食');
