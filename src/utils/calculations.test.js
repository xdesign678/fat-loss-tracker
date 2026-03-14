import { describe, expect, it } from 'vitest';
import { calculateBMR, formatDate, getDailyTip, getDaysBetween } from './calculations';

describe('getDailyTip', () => {
  const tips = ['先吃蛋白质', '控制零食', '饭后散步'];

  it('同一天会返回稳定的提示', () => {
    const first = getDailyTip(tips, new Date('2026-03-06T08:00:00'));
    const second = getDailyTip(tips, new Date('2026-03-06T21:00:00'));

    expect(first).toBe(second);
  });

  it('空数组时返回空字符串', () => {
    expect(getDailyTip([], new Date('2026-03-06'))).toBe('');
  });
});

describe('calculateBMR', () => {
  it('会根据性别使用不同的基础代谢估算', () => {
    expect(calculateBMR(70, 170, 30, 'male')).toBe(1617.5);
    expect(calculateBMR(70, 170, 30, 'female')).toBe(1451.5);
  });
});

describe('date helpers', () => {
  it('可以稳定格式化本地日期字符串', () => {
    expect(formatDate('2026-03-06', 'YYYY/MM/DD')).toBe('2026/03/06');
    expect(formatDate('2026-03-06T08:30:00.000Z')).toBe('2026-03-06');
  });

  it('可以计算日历日差值', () => {
    expect(getDaysBetween('2026-03-01', '2026-03-06')).toBe(5);
  });
});
