import { describe, expect, it } from 'vitest';
import {
  buildDailyActionPlan,
  getRecentEntries,
  shiftDate,
} from './tracking';

describe('shiftDate', () => {
  it('可以按天切换日期', () => {
    expect(shiftDate('2026-03-06', -1)).toBe('2026-03-05');
    expect(shiftDate('2026-03-06', 2)).toBe('2026-03-08');
  });
});

describe('buildDailyActionPlan', () => {
  it('能算出还差多少热量和蛋白质', () => {
    const plan = buildDailyActionPlan({
      calorieTarget: 2000,
      caloriesConsumed: 1450,
      proteinTarget: 180,
      proteinConsumed: 120,
      exerciseCalories: 220,
    });

    expect(plan.remainingCalories).toBe(550);
    expect(plan.remainingProtein).toBe(60);
    expect(plan.title).toContain('还可以');
  });

  it('超标时会给出收紧建议', () => {
    const plan = buildDailyActionPlan({
      calorieTarget: 1800,
      caloriesConsumed: 2100,
      proteinTarget: 160,
      proteinConsumed: 110,
      exerciseCalories: 0,
    });

    expect(plan.remainingCalories).toBe(-300);
    expect(plan.tone).toBe('warning');
  });
});

describe('getRecentEntries', () => {
  it('会按最近时间倒序去重提取常用记录', () => {
    const dailyLogs = {
      '2026-03-06': {
        foods: [
          { name: '鸡胸肉', calories: 160, protein: 31, carbs: 0, fat: 3, grams: 150, time: '12:30' },
          { name: '米饭', calories: 232, protein: 5, carbs: 51, fat: 1, grams: 200, time: '12:00' },
        ],
        exercises: [],
      },
      '2026-03-05': {
        foods: [
          { name: '鸡胸肉', calories: 133, protein: 26, carbs: 0, fat: 2, grams: 120, time: '18:00' },
        ],
        exercises: [
          { name: '快走（5-6km/h）', calories: 180, duration: 30, category: '有氧', time: '20:00' },
        ],
      },
    };

    const foods = getRecentEntries(dailyLogs, 'foods', 3);
    const exercises = getRecentEntries(dailyLogs, 'exercises', 3);

    expect(foods).toHaveLength(2);
    expect(foods[0].name).toBe('鸡胸肉');
    expect(foods[1].name).toBe('米饭');
    expect(exercises[0].name).toBe('快走（5-6km/h）');
  });
});
