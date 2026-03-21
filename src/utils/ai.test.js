import { describe, expect, it } from 'vitest';
import { extractJsonObject, extractJsonArray } from './ai';

describe('extractJsonObject', () => {
  it('能从混合文本中提取JSON对象', () => {
    const result = extractJsonObject('这是结果：{"name":"鸡胸肉","calories":165}');
    expect(result).toEqual({ name: '鸡胸肉', calories: 165 });
  });

  it('无法解析时抛出异常', () => {
    expect(() => extractJsonObject('没有JSON')).toThrow('AI返回格式异常');
  });
});

describe('extractJsonArray', () => {
  it('能从混合文本中提取JSON数组', () => {
    const result = extractJsonArray('结果：[{"name":"米饭"},{"name":"鸡蛋"}]');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('米饭');
  });

  it('无法解析时抛出异常', () => {
    expect(() => extractJsonArray('纯文本')).toThrow('AI返回格式异常');
  });
});
