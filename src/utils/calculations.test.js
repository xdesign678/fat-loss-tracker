import { describe, expect, it } from 'vitest';
import { getDailyTip } from './calculations';

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
