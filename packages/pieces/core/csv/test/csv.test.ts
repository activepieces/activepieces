/// <reference types="vitest/globals" />

import * as XLSX from 'xlsx';
import { csvToJsonAction } from '../src/lib/actions/convert-csv-to-json';
import { excelToCsvAction } from '../src/lib/actions/convert-excel-to-csv';
import { jsonToCsvAction } from '../src/lib/actions/convert-json-to-csv';
import { createMockActionContext } from '@activepieces/pieces-framework';

function makeXlsxBase64(sheets: Record<string, (string | number)[][]>): string {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  }
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

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

describe('excelToCsvAction', () => {
  test('converts first sheet to CSV with comma delimiter', async () => {
    const base64 = makeXlsxBase64({ Sheet1: [['name', 'age'], ['Alice', 30], ['Bob', 25]] });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: '', delimiter_type: ',' },
    });
    const result = await excelToCsvAction.run(ctx);
    expect(result.csv).toContain('name,age');
    expect(result.csv).toContain('Alice,30');
    expect(result.csv).toContain('Bob,25');
    expect(result.sheet_name).toBe('Sheet1');
    expect(result.available_sheets).toEqual(['Sheet1']);
  });

  test('uses tab delimiter', async () => {
    const base64 = makeXlsxBase64({ Sheet1: [['name', 'age'], ['Alice', 30]] });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: '', delimiter_type: '\t' },
    });
    const result = await excelToCsvAction.run(ctx);
    expect(result.csv).toContain('name\tage');
    expect(result.csv).toContain('Alice\t30');
  });

  test('uses semicolon delimiter', async () => {
    const base64 = makeXlsxBase64({ Sheet1: [['name', 'age'], ['Alice', 30]] });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: '', delimiter_type: ';' },
    });
    const result = await excelToCsvAction.run(ctx);
    expect(result.csv).toContain('name;age');
    expect(result.csv).toContain('Alice;30');
  });

  test('selects a named sheet from a multi-sheet workbook', async () => {
    const base64 = makeXlsxBase64({
      Employees: [['name'], ['Alice']],
      Products: [['sku'], ['P001']],
    });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: 'Products', delimiter_type: ',' },
    });
    const result = await excelToCsvAction.run(ctx);
    expect(result.csv).toContain('sku');
    expect(result.csv).toContain('P001');
    expect(result.sheet_name).toBe('Products');
    expect(result.available_sheets).toEqual(['Employees', 'Products']);
  });

  test('defaults to first sheet when sheet_name is blank', async () => {
    const base64 = makeXlsxBase64({
      First: [['id'], [1]],
      Second: [['id'], [2]],
    });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: '', delimiter_type: ',' },
    });
    const result = await excelToCsvAction.run(ctx);
    expect(result.sheet_name).toBe('First');
  });

  test('throws when sheet name does not exist', async () => {
    const base64 = makeXlsxBase64({ Sheet1: [['a'], [1]] });
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'xlsx', filename: 'test.xlsx' }, sheet_name: 'Missing', delimiter_type: ',' },
    });
    await expect(excelToCsvAction.run(ctx)).rejects.toThrow('Sheet "Missing" not found');
  });

  test('throws for a non-Excel file', async () => {
    const base64 = Buffer.from('this is not an excel file').toString('base64');
    const ctx = createMockActionContext({
      propsValue: { file: { base64, extension: 'txt', filename: 'fake.txt' }, sheet_name: '', delimiter_type: ',' },
    });
    await expect(excelToCsvAction.run(ctx)).rejects.toThrow('does not appear to be a valid Excel file');
  });
});
