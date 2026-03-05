// BMR计算 - Mifflin-St Jeor公式（男性）
export function calculateBMR(weightKg, heightCm, age) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

// TDEE计算
export function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,      // 久坐
    light: 1.375,        // 轻度活动
    moderate: 1.55,      // 中度活动
    active: 1.725,       // 高度活动
    veryActive: 1.9      // 极高活动
  };
  return bmr * (multipliers[activityLevel] || 1.2);
}

// 计算每日目标热量（基于目标减重速度）
export function calculateDailyCalorieTarget(tdee, weeklyLossKg) {
  const dailyDeficit = (weeklyLossKg * 7700) / 7;
  return Math.max(tdee - dailyDeficit, 1200); // 最低不低于1200
}

// 计算预期达标天数
export function calculateDaysToGoal(currentWeight, targetWeight, weeklyLossKg) {
  if (currentWeight <= targetWeight) return 0;
  const totalToLose = currentWeight - targetWeight;
  return Math.ceil((totalToLose / weeklyLossKg) * 7);
}

// 推荐每周减重速度（基于需要减的总重量）
export function recommendedWeeklyLoss(currentWeight, targetWeight) {
  const tolose = currentWeight - targetWeight;
  if (tolose > 25) return 1.0;
  if (tolose > 15) return 0.75;
  if (tolose > 5) return 0.5;
  return 0.3;
}

// 计算蛋白质目标（基于体重）
export function calculateProteinTarget(weightKg, isHighBF) {
  // 大体重者按瘦体重计算，约1.6-2.0g/kg瘦体重
  // 简化：高体脂用1.5g/kg体重，低体脂用2.0g/kg体重
  return isHighBF ? Math.round(weightKg * 1.5) : Math.round(weightKg * 2.0);
}

// 计算进度百分比
export function calculateProgress(startWeight, currentWeight, targetWeight) {
  if (startWeight <= targetWeight) return 100;
  const totalToLose = startWeight - targetWeight;
  const lost = startWeight - currentWeight;
  return Math.min(Math.max(Math.round((lost / totalToLose) * 100), 0), 100);
}

// 计算BMI
export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// BMI等级
export function getBMICategory(bmi) {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  if (bmi < 35) return '肥胖';
  return '重度肥胖';
}

// 获取一周的日期数组
export function getWeekDates(date = new Date()) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// 格式化日期
export function formatDate(date, format) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (!format) return `${yyyy}-${mm}-${dd}`;
  return format
    .replace('YYYY', yyyy)
    .replace('MM', mm)
    .replace('DD', dd);
}
