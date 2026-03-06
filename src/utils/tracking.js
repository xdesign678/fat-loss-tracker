import { formatDate } from './calculations';

export function shiftDate(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function buildDailyActionPlan({
  calorieTarget = 0,
  caloriesConsumed = 0,
  proteinTarget = 0,
  proteinConsumed = 0,
  exerciseCalories = 0,
}) {
  const remainingCalories = Math.round(calorieTarget - caloriesConsumed);
  const remainingProtein = Math.max(Math.round(proteinTarget - proteinConsumed), 0);

  if (remainingCalories < 0) {
    return {
      remainingCalories,
      remainingProtein,
      tone: 'warning',
      title: `今天已超出 ${Math.abs(remainingCalories)} 千卡`,
      suggestion: remainingProtein > 0
        ? `后面尽量选高蛋白、低油的食物，蛋白质还差 ${remainingProtein}g。`
        : '后面尽量清淡一点，优先蔬菜和低热量食物。',
      exerciseHint: exerciseCalories > 0
        ? `今天已经运动消耗 ${exerciseCalories} 千卡。`
        : '如果状态允许，可以补一段轻量活动拉回目标。',
    };
  }

  if (remainingCalories <= 300) {
    return {
      remainingCalories,
      remainingProtein,
      tone: 'calm',
      title: `今天还可以吃 ${remainingCalories} 千卡`,
      suggestion: remainingProtein > 0
        ? `快收口了，优先补 ${remainingProtein}g 蛋白质。`
        : '热量控制得不错，后面尽量别吃高油零食。',
      exerciseHint: exerciseCalories > 0
        ? `今天已经额外消耗 ${exerciseCalories} 千卡。`
        : '不想吃太多的话，可以用散步补一点消耗。',
    };
  }

  return {
    remainingCalories,
    remainingProtein,
    tone: 'positive',
    title: `今天还可以吃 ${remainingCalories} 千卡`,
    suggestion: remainingProtein > 0
      ? `蛋白质还差 ${remainingProtein}g，优先安排鸡胸肉、鸡蛋、牛肉这类食物。`
      : '热量空间还比较充足，正常吃也别太放飞。',
    exerciseHint: exerciseCalories > 0
      ? `今天运动消耗了 ${exerciseCalories} 千卡，节奏不错。`
      : '如果晚上有空，补 20 到 30 分钟轻有氧会更稳。',
  };
}

export function getRecentEntries(dailyLogs, type, limit = 5) {
  const entries = Object.entries(dailyLogs || {})
    .flatMap(([date, log]) => (log?.[type] || []).map((item, index) => ({
      ...item,
      _date: date,
      _index: index,
      _time: item.time || '00:00',
    })))
    .sort((a, b) => `${b._date} ${b._time}`.localeCompare(`${a._date} ${a._time}`));

  const seen = new Set();
  const recent = [];

  for (const entry of entries) {
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    recent.push(entry);
    if (recent.length >= limit) break;
  }

  return recent.map((entry) => {
    const item = { ...entry };
    delete item._date;
    delete item._index;
    delete item._time;
    return item;
  });
}
