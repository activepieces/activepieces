/// <reference types="vitest/globals" />

import { addition } from '../src/lib/actions/addition';
import { subtraction } from '../src/lib/actions/subtraction';
import { multiplication } from '../src/lib/actions/multiplication';
import { division } from '../src/lib/actions/division';
import { modulo } from '../src/lib/actions/modulo';
import { generateRandom } from '../src/lib/actions/generateRandom';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('addition', () => {
  test('adds two positive numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 3, second_number: 5 },
    });
    expect(await addition.run(ctx)).toBe(8);
  });

  test('adds negative numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: -3, second_number: -5 },
    });
    expect(await addition.run(ctx)).toBe(-8);
  });

  test('adds decimal numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 1.5, second_number: 2.3 },
    });
    expect(await addition.run(ctx)).toBeCloseTo(3.8);
  });
});

describe('subtraction', () => {
  test('subtracts first from second', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 3, second_number: 10 },
    });
    expect(await subtraction.run(ctx)).toBe(7);
  });

  test('returns negative when first > second', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 3 },
    });
    expect(await subtraction.run(ctx)).toBe(-7);
  });

});

describe('multiplication', () => {
  test('multiplies two positive numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 4, second_number: 5 },
    });
    expect(await multiplication.run(ctx)).toBe(20);
  });

  test('multiplies negative numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: -3, second_number: -4 },
    });
    expect(await multiplication.run(ctx)).toBe(12);
  });
});

describe('division', () => {
  test('divides two numbers', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 2 },
    });
    expect(await division.run(ctx)).toBe(5);
  });

  test('divides with decimal result', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 7, second_number: 2 },
    });
    expect(await division.run(ctx)).toBe(3.5);
  });

  test('throws on divide by zero', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 0 },
    });
    await expect(division.run(ctx)).rejects.toThrow();
  });
});

describe('modulo', () => {
  test('returns remainder', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 3 },
    });
    expect(await modulo.run(ctx)).toBe(1);
  });

  test('returns 0 when evenly divisible', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 5 },
    });
    expect(await modulo.run(ctx)).toBe(0);
  });

  test('handles negative modulo', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: -10, second_number: 3 },
    });
    expect(await modulo.run(ctx)).toBe(-1);
  });

  test('throws on zero divisor', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 0 },
    });
    await expect(modulo.run(ctx)).rejects.toThrow();
  });
});

describe('generateRandom', () => {
  test('generates number within range', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 1, second_number: 10 },
    });
    const result = await generateRandom.run(ctx);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });

  test('stays inside decimal bounds', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 1.5, second_number: 3.5 },
    });
    for (let i = 0; i < 50; i++) {
      const result = await generateRandom.run(ctx);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(3);
    }
  });

  test('accepts reversed bounds', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 10, second_number: 1 },
    });
    for (let i = 0; i < 50; i++) {
      const result = await generateRandom.run(ctx);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  test('returns the bound when both are equal', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 7, second_number: 7 },
    });
    expect(await generateRandom.run(ctx)).toBe(7);
  });

  test('throws when the range holds no whole number', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 1.2, second_number: 1.8 },
    });
    await expect(generateRandom.run(ctx)).rejects.toThrow();
  });

  test('throws when both bounds are the same decimal', async () => {
    const ctx = createMockActionContext({
      propsValue: { first_number: 2.5, second_number: 2.5 },
    });
    await expect(generateRandom.run(ctx)).rejects.toThrow();
  });
});
