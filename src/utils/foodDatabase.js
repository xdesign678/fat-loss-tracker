// 常见食物热量数据库（每100g的热量kcal和宏量营养素g）
export const foodDatabase = [
  // 主食
  { name: '米饭（熟）', calories: 116, protein: 2.6, carbs: 25.6, fat: 0.3, category: '主食' },
  { name: '面条（熟）', calories: 110, protein: 3.5, carbs: 22.0, fat: 0.6, category: '主食' },
  { name: '馒头', calories: 221, protein: 7.0, carbs: 47.0, fat: 1.1, category: '主食' },
  { name: '燕麦（干）', calories: 367, protein: 15.0, carbs: 58.0, fat: 7.0, category: '主食' },
  { name: '紫薯', calories: 82, protein: 1.6, carbs: 18.0, fat: 0.2, category: '主食' },
  { name: '玉米', calories: 112, protein: 4.0, carbs: 22.0, fat: 1.2, category: '主食' },
  { name: '全麦面包', calories: 247, protein: 9.0, carbs: 46.0, fat: 3.5, category: '主食' },
  { name: '杂粮饭', calories: 105, protein: 3.0, carbs: 22.0, fat: 0.5, category: '主食' },

  // 肉类
  { name: '鸡胸肉', calories: 133, protein: 31.0, carbs: 0, fat: 1.2, category: '肉类' },
  { name: '牛里脊', calories: 125, protein: 22.0, carbs: 0, fat: 4.0, category: '肉类' },
  { name: '猪里脊', calories: 143, protein: 20.0, carbs: 0, fat: 7.0, category: '肉类' },
  { name: '虾仁', calories: 87, protein: 18.0, carbs: 1.0, fat: 0.7, category: '肉类' },
  { name: '三文鱼', calories: 139, protein: 22.0, carbs: 0, fat: 6.0, category: '肉类' },
  { name: '鸡蛋（全蛋）', calories: 144, protein: 13.0, carbs: 1.0, fat: 10.0, category: '肉类' },
  { name: '蛋白（鸡蛋清）', calories: 48, protein: 11.0, carbs: 0.7, fat: 0, category: '肉类' },
  { name: '豆腐', calories: 73, protein: 8.0, carbs: 2.0, fat: 4.0, category: '肉类' },
  { name: '带鱼', calories: 127, protein: 18.0, carbs: 0, fat: 6.0, category: '肉类' },
  { name: '鲈鱼', calories: 97, protein: 18.0, carbs: 0, fat: 3.0, category: '肉类' },
  { name: '五花肉', calories: 395, protein: 14.0, carbs: 0, fat: 37.0, category: '肉类' },
  { name: '鸡腿（去皮）', calories: 162, protein: 24.0, carbs: 0, fat: 7.0, category: '肉类' },

  // 蔬菜
  { name: '西兰花', calories: 34, protein: 4.0, carbs: 5.0, fat: 0.4, category: '蔬菜' },
  { name: '菠菜', calories: 24, protein: 2.6, carbs: 3.0, fat: 0.3, category: '蔬菜' },
  { name: '黄瓜', calories: 15, protein: 0.7, carbs: 3.0, fat: 0.1, category: '蔬菜' },
  { name: '番茄', calories: 19, protein: 0.9, carbs: 3.5, fat: 0.2, category: '蔬菜' },
  { name: '生菜', calories: 13, protein: 1.3, carbs: 1.9, fat: 0.2, category: '蔬菜' },
  { name: '胡萝卜', calories: 32, protein: 0.8, carbs: 7.0, fat: 0.2, category: '蔬菜' },
  { name: '青椒', calories: 23, protein: 1.0, carbs: 4.5, fat: 0.2, category: '蔬菜' },
  { name: '白菜', calories: 17, protein: 1.5, carbs: 2.5, fat: 0.2, category: '蔬菜' },
  { name: '芹菜', calories: 14, protein: 0.7, carbs: 2.5, fat: 0.2, category: '蔬菜' },

  // 水果
  { name: '苹果', calories: 52, protein: 0.3, carbs: 14.0, fat: 0.2, category: '水果' },
  { name: '香蕉', calories: 93, protein: 1.1, carbs: 23.0, fat: 0.2, category: '水果' },
  { name: '橙子', calories: 47, protein: 0.9, carbs: 11.0, fat: 0.1, category: '水果' },
  { name: '蓝莓', calories: 57, protein: 0.7, carbs: 14.0, fat: 0.3, category: '水果' },
  { name: '猕猴桃', calories: 56, protein: 1.0, carbs: 12.0, fat: 0.4, category: '水果' },

  // 饮品
  { name: '无糖豆浆（300ml）', calories: 54, protein: 6.0, carbs: 3.0, fat: 2.0, category: '饮品', defaultGrams: 300 },
  { name: '牛奶（全脂250ml）', calories: 163, protein: 8.0, carbs: 12.0, fat: 9.0, category: '饮品', defaultGrams: 250 },
  { name: '黑咖啡', calories: 2, protein: 0, carbs: 0.4, fat: 0, category: '饮品', defaultGrams: 250 },
  { name: '珍珠奶茶（大杯）', calories: 550, protein: 3.0, carbs: 85.0, fat: 20.0, category: '饮品', defaultGrams: 700 },
  { name: '可乐（330ml）', calories: 140, protein: 0, carbs: 35.0, fat: 0, category: '饮品', defaultGrams: 330 },
  { name: '啤酒（500ml）', calories: 215, protein: 1.5, carbs: 17.0, fat: 0, category: '饮品', defaultGrams: 500 },
  { name: '白酒（100ml）', calories: 298, protein: 0, carbs: 0.5, fat: 0, category: '饮品', defaultGrams: 100 },

  // 零食/其他
  { name: '坚果混合（一把30g）', calories: 174, protein: 5.0, carbs: 6.0, fat: 15.0, category: '零食' },
  { name: '巧克力（牛奶）', calories: 535, protein: 7.0, carbs: 60.0, fat: 30.0, category: '零食' },
  { name: '薯片', calories: 536, protein: 7.0, carbs: 52.0, fat: 33.0, category: '零食' },
  { name: '蛋白棒', calories: 220, protein: 20.0, carbs: 24.0, fat: 6.0, category: '零食', defaultGrams: 60 },
];

// 运动热量消耗数据库（每30分钟，以100kg男性为基准）
export const exerciseDatabase = [
  { name: '快走（5-6km/h）', caloriesPer30Min: 200, category: '有氧', jointImpact: '中' },
  { name: '慢跑（8km/h）', caloriesPer30Min: 430, category: '有氧', jointImpact: '高' },
  { name: '游泳（自由泳）', caloriesPer30Min: 420, category: '有氧', jointImpact: '极低' },
  { name: '固定自行车', caloriesPer30Min: 340, category: '有氧', jointImpact: '低' },
  { name: '椭圆机', caloriesPer30Min: 310, category: '有氧', jointImpact: '低' },
  { name: '划船机', caloriesPer30Min: 360, category: '有氧', jointImpact: '低' },
  { name: '跳绳', caloriesPer30Min: 500, category: '有氧', jointImpact: '极高' },
  { name: '爬楼梯', caloriesPer30Min: 380, category: '有氧', jointImpact: '中' },
  { name: '力量训练（一般）', caloriesPer30Min: 150, category: '力量', jointImpact: '低' },
  { name: '力量训练（高强度）', caloriesPer30Min: 240, category: '力量', jointImpact: '中' },
  { name: '瑜伽', caloriesPer30Min: 130, category: '柔韧', jointImpact: '极低' },
  { name: '篮球', caloriesPer30Min: 350, category: '球类', jointImpact: '高' },
  { name: '羽毛球', caloriesPer30Min: 280, category: '球类', jointImpact: '中' },
  { name: '日常走路', caloriesPer30Min: 140, category: '日常', jointImpact: '低' },
];

// 根据实际体重调整热量消耗
export function adjustCaloriesBurn(baseCalories, actualWeight, baseWeight = 100) {
  return Math.round(baseCalories * (actualWeight / baseWeight));
}

// 搜索食物
export function searchFood(query) {
  const q = query.toLowerCase();
  return foodDatabase.filter(f => f.name.toLowerCase().includes(q));
}

// 搜索运动
export function searchExercise(query) {
  const q = query.toLowerCase();
  return exerciseDatabase.filter(e => e.name.toLowerCase().includes(q));
}
