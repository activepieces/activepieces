/// <reference types="vitest/globals" />

import { Readable } from 'node:stream';
import { createCsvParser, CsvRow } from '../src/lib/csv';

async function parseCsv(
  input: string,
  delimiter = ','
): Promise<{ headers: string[]; rows: CsvRow[] }> {
  const { parser, getHeaders } = createCsvParser({ delimiter });
  Readable.from([input]).pipe(parser);
  const rows: CsvRow[] = [];
  for await (const row of parser) {
    rows.push(row);
  }
  return { headers: getHeaders(), rows };
}

describe('createCsvParser', () => {
  test('strips the UTF-8 BOM Excel writes, so the first column is addressable', async () => {
    const { headers, rows } = await parseCsv('﻿id,name\n1,x\n');

    expect(headers[0]).toBe('id');
    expect(rows[0]['id']).toBe('1');
  });

  test('keeps both values when a header name is duplicated', async () => {
    const { rows } = await parseCsv('a,a,b\n1,2,x\n');

    expect(rows[0]['a']).toEqual(['1', '2']);
    expect(rows[0]['b']).toBe('x');
  });

  test('a row shorter or longer than the header does not abort the file', async () => {
    const { rows } = await parseCsv('a,b,c\n1,2\n3,4,5,6\n');

    expect(rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4', c: '5' },
    ]);
  });

  test('trims padding without eating a tab delimiter', async () => {
    const { headers, rows } = await parseCsv('a\tb\n  x  \ty\n', '\t');

    expect(headers).toEqual(['a', 'b']);
    expect(rows[0]).toEqual({ a: 'x', b: 'y' });
  });
});
