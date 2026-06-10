/// <reference types="vitest/globals" />

import { calculateAverage } from '../src/lib/actions/calculate-average';
import { calculateSum } from '../src/lib/actions/calculate-sum';
import { countUniques } from '../src/lib/actions/count-uniques';
import { getMinMax } from '../src/lib/actions/get-min-max';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('calculateAverage', () => {
  test('calculates average of numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [10, 20, 30] },
    });
    const result = await calculateAverage.run(ctx);
    expect(result).toEqual({ average: 20 });
  });

  test('handles string numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: ['10', '20', '30'] },
    });
    const result = await calculateAverage.run(ctx);
    expect(result).toEqual({ average: 20 });
  });

  test('throws on non-numeric values', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: ['abc', 1, 2] },
    });
    await expect(calculateAverage.run(ctx)).rejects.toThrow();
  });
});

describe('calculateSum', () => {
  test('calculates sum of numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [1, 2, 3, 4, 5] },
    });
    const result = await calculateSum.run(ctx);
    expect(result).toEqual({ sum: 15 });
  });

  test('handles string numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: ['10', '20'] },
    });
    const result = await calculateSum.run(ctx);
    expect(result).toEqual({ sum: 30 });
  });

  test('handles negative numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [-5, 10, -3] },
    });
    const result = await calculateSum.run(ctx);
    expect(result).toEqual({ sum: 2 });
  });

  test('throws on non-numeric values', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [1, 'not-a-number'] },
    });
    await expect(calculateSum.run(ctx)).rejects.toThrow();
  });
});

describe('countUniques', () => {
  test('counts unique primitive values', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [1, 2, 2, 3, 3, 3], fieldsExplanation: '', fields: [] },
    });
    const result = await countUniques.run(ctx);
    expect(result).toEqual({ numUniques: 3 });
  });

  test('counts unique objects with fields filter', async () => {
    const values = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Alice', age: 35 },
    ];
    const ctx = createMockActionContext({
      propsValue: { note: '', values, fieldsExplanation: '', fields: ['name'] },
    });
    const result = await countUniques.run(ctx);
    expect(result).toEqual({ numUniques: 2 });
  });

  test('counts unique objects without fields filter', async () => {
    const values = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Alice', age: 30 },
    ];
    const ctx = createMockActionContext({
      propsValue: { note: '', values, fieldsExplanation: '', fields: [] },
    });
    const result = await countUniques.run(ctx);
    expect(result).toEqual({ numUniques: 2 });
  });
});

describe('getMinMax', () => {
  test('finds min and max of numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [3, 1, 4, 1, 5, 9] },
    });
    const result = await getMinMax.run(ctx);
    expect(result).toEqual({ min: 1, max: 9 });
  });

  test('handles string numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: ['100', '5', '50'] },
    });
    const result = await getMinMax.run(ctx);
    expect(result).toEqual({ min: 5, max: 100 });
  });

  test('handles negative numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: [-10, -5, -20] },
    });
    const result = await getMinMax.run(ctx);
    expect(result).toEqual({ min: -20, max: -5 });
  });

  test('throws on non-numeric values', async () => {
    const ctx = createMockActionContext({
      propsValue: { note: '', values: ['abc'] },
    });
    await expect(getMinMax.run(ctx)).rejects.toThrow();
  });
});
