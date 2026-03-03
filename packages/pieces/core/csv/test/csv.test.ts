/// <reference types="vitest/globals" />

import { csvToJsonAction } from '../src/lib/actions/convert-csv-to-json';
import { jsonToCsvAction } from '../src/lib/actions/convert-json-to-csv';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('csvToJsonAction', () => {
  test('converts CSV with headers to JSON', async () => {
    const csvText = 'name,age\nAlice,30\nBob,25';
    const ctx = createMockActionContext({
      propsValue: { csv_text: csvText, has_headers: true, delimiter_type: ',' },
    });
    const result = await csvToJsonAction.run(ctx);
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  test('converts CSV without headers to JSON arrays', async () => {
    const csvText = 'Alice,30\nBob,25';
    const ctx = createMockActionContext({
      propsValue: { csv_text: csvText, has_headers: false, delimiter_type: ',' },
    });
    const result = await csvToJsonAction.run(ctx);
    expect(result).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ]);
  });

  test('handles tab delimiter', async () => {
    const csvText = 'name\tage\nAlice\t30';
    const ctx = createMockActionContext({
      propsValue: { csv_text: csvText, has_headers: true, delimiter_type: '\t' },
    });
    const result = await csvToJsonAction.run(ctx);
    expect(result).toEqual([{ name: 'Alice', age: '30' }]);
  });

  test('handles quoted fields with commas', async () => {
    const csvText = 'name,address\nAlice,"123 Main St, Apt 4"';
    const ctx = createMockActionContext({
      propsValue: { csv_text: csvText, has_headers: true, delimiter_type: ',' },
    });
    const result = await csvToJsonAction.run(ctx);
    expect(result).toEqual([
      { name: 'Alice', address: '123 Main St, Apt 4' },
    ]);
  });

  test('throws error if input is not a string', async () => {
    const ctx = createMockActionContext({
      propsValue: { csv_text: 123 as unknown as string, has_headers: true, delimiter_type: ',' },
    });
    await expect(csvToJsonAction.run(ctx)).rejects.toThrow();
  });
});

describe('jsonToCsvAction', () => {
  test('converts JSON array to CSV', async () => {
    const jsonArray = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const ctx = createMockActionContext({
      propsValue: { markdown: '', json_array: jsonArray, delimiter_type: ',' },
    });
    const result = await jsonToCsvAction.run(ctx);
    expect(result).toContain('name');
    expect(result).toContain('age');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  test('flattens nested objects', async () => {
    const jsonArray = [
      { name: 'Alice', address: { street: '123 Main', city: 'LA' } },
    ];
    const ctx = createMockActionContext({
      propsValue: { markdown: '', json_array: jsonArray, delimiter_type: ',' },
    });
    const result = await jsonToCsvAction.run(ctx);
    expect(result).toContain('address.street');
    expect(result).toContain('address.city');
    expect(result).toContain('123 Main');
    expect(result).toContain('LA');
  });

  test('handles tab delimiter', async () => {
    const jsonArray = [{ name: 'Alice', age: 30 }];
    const ctx = createMockActionContext({
      propsValue: { markdown: '', json_array: jsonArray, delimiter_type: '\t' },
    });
    const result = await jsonToCsvAction.run(ctx);
    expect(result).toContain('\t');
  });

  test('throws error if input is not an array', async () => {
    const ctx = createMockActionContext({
      propsValue: { markdown: '', json_array: { not: 'an array' } as unknown as unknown[], delimiter_type: ',' },
    });
    await expect(jsonToCsvAction.run(ctx)).rejects.toThrow();
  });
});
