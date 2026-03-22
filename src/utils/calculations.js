import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format as formatWithPattern,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns';

function normalizePattern(pattern = 'yyyy-MM-dd') {
  return pattern
    .replaceAll('YYYY', 'yyyy')
    .replaceAll('DD', 'dd');
}

export function toDate(value = new Date()) {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return parseISO(value);
  return new Date(value);
}

// BMR 计算（Mifflin-St Jeor 估算）
export function calculateBMR(weightKg, heightCm, age, sex = 'male') {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (sex === 'female') {
    return base - 161;
  }

  return base + 5;
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

export function getDaysBetween(startDate, endDate = new Date()) {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!isValid(start) || !isValid(end)) {
    return 0;
  }

  return Math.max(differenceInCalendarDays(end, start), 0);
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
  const currentDate = toDate(date);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });
}

export function getDateRange(endDate = new Date(), days = 7) {
  const end = toDate(endDate);
  const safeDays = Math.max(days, 1);
  const start = addDays(end, -(safeDays - 1));

  return eachDayOfInterval({ start, end });
}

// 格式化日期
export function formatDate(date, format) {
  const parsedDate = toDate(date);

  if (!isValid(parsedDate)) {
    return '';
  }

  return formatWithPattern(parsedDate, normalizePattern(format));
}

export function getDailyTip(tips, date = new Date()) {
  if (!Array.isArray(tips) || tips.length === 0) return '';

  const seed = formatDate(date);
  const hash = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tips[hash % tips.length];
}

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 获取某日期所在周的热量预算数据（周内动态分配）
export function getWeeklyCalorieData(dailyLogs, dailyTarget, date = new Date()) {
  const weekDates = getWeekDates(date);
  const today = formatDate(new Date());

  let totalConsumed = 0;
  let pastDays = 0;

  const days = weekDates.map((d, i) => {
    const dateKey = formatDate(d);
    const isPast = dateKey <= today;
    const isToday = dateKey === today;
    const log = dailyLogs[dateKey] || { foods: [] };
    const calories = isPast
      ? Math.round(log.foods.reduce((sum, food) => sum + (food.calories || 0), 0))
      : null;

    if (isPast) {
      totalConsumed += calories || 0;
      pastDays++;
    }

    // Status based on original daily target
    let status = 'future';
    if (isPast && calories !== null) {
      const ratio = dailyTarget > 0 ? calories / dailyTarget : 0;
      if (ratio > 1.1) status = 'over';
      else if (ratio > 1.0) status = 'warning';
      else status = 'on_track';
    }

    return { date: dateKey, dayLabel: DAY_LABELS[i], calories, status, isToday };
  });

  const weeklyBudget = Math.round(dailyTarget * 7);
  const remaining = weeklyBudget - totalConsumed;
  const futureDays = 7 - pastDays;
  const remainingAvg = futureDays > 0 ? Math.round(remaining / futureDays) : 0;

  // Add vsBudgetAvg indicator for past days
  for (const day of days) {
    if (day.calories !== null) {
      day.vsBudgetAvg = day.calories > remainingAvg ? 'above' : 'below';
    } else {
      day.vsBudgetAvg = null;
    }
  }

  return {
    weekStart: formatDate(weekDates[0]),
    weekEnd: formatDate(weekDates[6]),
    dailyTarget: Math.round(dailyTarget),
    weeklyBudget,
    totalConsumed,
    remainingAvg,
    progressPercent: weeklyBudget > 0 ? Math.round((totalConsumed / weeklyBudget) * 100) : 0,
    days,
  };
}
