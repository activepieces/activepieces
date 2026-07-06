/// <reference types="vitest/globals" />

import { jsonToAsciiTable } from '../src/lib/actions/json-to-ascii-table';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('jsonToAsciiTable action', () => {
  test('converts array of objects to table', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        data: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      },
    });
    const result = await jsonToAsciiTable.run(ctx);
    expect(result).toContain('name');
    expect(result).toContain('age');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('30');
    expect(result).toContain('25');
  });

  test('returns empty string for empty array', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        data: [],
      },
    });
    const result = await jsonToAsciiTable.run(ctx);
    expect(result).toBe('');
  });

  test('throws error for non-array input', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        data: { key: 'value' },
      },
    });
    await expect(jsonToAsciiTable.run(ctx)).rejects.toThrow(
      'Input must be an array of objects'
    );
  });

  test('handles missing keys across objects', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        data: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', city: 'NYC' },
        ],
      },
    });
    const result = await jsonToAsciiTable.run(ctx);
    expect(result).toContain('name');
    expect(result).toContain('age');
    expect(result).toContain('city');
  });

  test('produces correct table format', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        data: [{ a: '1', b: '2' }],
      },
    });
    const result = await jsonToAsciiTable.run(ctx);
    const lines = (result as string).split('\n');
    // separator, header, separator, data row, separator
    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatch(/^\+[-+]+\+$/);
    expect(lines[1]).toMatch(/^\|.*a.*\|.*b.*\|$/);
    expect(lines[2]).toMatch(/^\+[-+]+\+$/);
    expect(lines[3]).toMatch(/^\|.*1.*\|.*2.*\|$/);
    expect(lines[4]).toMatch(/^\+[-+]+\+$/);
  });
});
