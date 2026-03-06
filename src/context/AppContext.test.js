import { describe, expect, it } from 'vitest';
import { createDefaultState, normalizeState, reducer } from './AppContext';

describe('normalizeState', () => {
  it('会补齐旧版本缺失字段', () => {
    const normalized = normalizeState({
      profile: { currentWeight: 88 },
      setupComplete: true,
    });

    expect(normalized.profile.currentWeight).toBe(88);
    expect(normalized.profile.targetWeight).toBe(createDefaultState().profile.targetWeight);
    expect(normalized.weightHistory).toEqual([]);
    expect(normalized.aiSettings.models).toEqual([]);
    expect(normalized.setupComplete).toBe(true);
  });

  it('非法输入时回退默认状态', () => {
    const normalized = normalizeState(null);

    expect(normalized.profile.startWeight).toBe(createDefaultState().profile.startWeight);
    expect(normalized.dailyLogs).toEqual({});
  });

  it('会为旧日志补齐稳定 id', () => {
    const normalized = normalizeState({
      dailyLogs: {
        '2026-03-06': {
          foods: [{ name: '鸡胸肉', calories: 150 }],
          exercises: [{ name: '快走', calories: 200 }],
        },
      },
    });

    expect(normalized.dailyLogs['2026-03-06'].foods[0].id).toBeTruthy();
    expect(normalized.dailyLogs['2026-03-06'].exercises[0].id).toBeTruthy();
  });
});

describe('reducer', () => {
  it('记录食物时会自动分配 id', () => {
    const nextState = reducer(createDefaultState(), {
      type: 'LOG_FOOD',
      payload: {
        date: '2026-03-06',
        food: { name: '米饭', calories: 200 },
      },
    });

    expect(nextState.dailyLogs['2026-03-06'].foods[0].id).toBeTruthy();
  });

  it('会按 id 删除食物记录', () => {
    const state = normalizeState({
      dailyLogs: {
        '2026-03-06': {
          foods: [
            { id: 'food-1', name: '米饭', calories: 200 },
            { id: 'food-2', name: '鸡胸肉', calories: 160 },
          ],
          exercises: [],
        },
      },
    });

    const nextState = reducer(state, {
      type: 'REMOVE_FOOD',
      payload: { date: '2026-03-06', id: 'food-1' },
    });

    expect(nextState.dailyLogs['2026-03-06'].foods).toHaveLength(1);
    expect(nextState.dailyLogs['2026-03-06'].foods[0].id).toBe('food-2');
  });

  it('会按 id 更新食物记录', () => {
    const state = normalizeState({
      dailyLogs: {
        '2026-03-06': {
          foods: [
            { id: 'food-1', name: '米饭', calories: 200, protein: 4 },
          ],
          exercises: [],
        },
      },
    });

    const nextState = reducer(state, {
      type: 'UPDATE_FOOD',
      payload: {
        date: '2026-03-06',
        id: 'food-1',
        food: { name: '糙米饭', calories: 180, protein: 5 },
      },
    });

    expect(nextState.dailyLogs['2026-03-06'].foods[0].id).toBe('food-1');
    expect(nextState.dailyLogs['2026-03-06'].foods[0].name).toBe('糙米饭');
    expect(nextState.dailyLogs['2026-03-06'].foods[0].calories).toBe(180);
  });

  it('会按 id 更新运动记录', () => {
    const state = normalizeState({
      dailyLogs: {
        '2026-03-06': {
          foods: [],
          exercises: [
            { id: 'exercise-1', name: '快走', calories: 200, duration: 30 },
          ],
        },
      },
    });

    const nextState = reducer(state, {
      type: 'UPDATE_EXERCISE',
      payload: {
        date: '2026-03-06',
        id: 'exercise-1',
        exercise: { name: '椭圆机', calories: 260, duration: 35 },
      },
    });

    expect(nextState.dailyLogs['2026-03-06'].exercises[0].id).toBe('exercise-1');
    expect(nextState.dailyLogs['2026-03-06'].exercises[0].name).toBe('椭圆机');
    expect(nextState.dailyLogs['2026-03-06'].exercises[0].duration).toBe(35);
  });
});
