/// <reference types="vitest/globals" />

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { csvUtils } from '../src/lib/common/csv-utils';
import { readCsvFileAction } from '../src/lib/actions/read-csv-file';
import { createCsvFileAction } from '../src/lib/actions/create-csv-file';
import { convertCsvToExcelAction } from '../src/lib/actions/convert-csv-to-excel';
import { filterCsvRowsAction } from '../src/lib/actions/filter-csv-rows';
import { sortCsvRowsAction } from '../src/lib/actions/sort-csv-rows';
import { removeDuplicateCsvRowsAction } from '../src/lib/actions/remove-duplicate-csv-rows';
import { selectCsvColumnsAction } from '../src/lib/actions/select-csv-columns';
import { mergeCsvAction } from '../src/lib/actions/merge-csv';
import { splitCsvAction } from '../src/lib/actions/split-csv';

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, 'fixtures', name));
const fixtureText = (name: string) => fixture(name).toString('utf8');
const asFile = (name: string) => ({ filename: name, extension: 'csv', data: fixture(name) });

function withFileCapture<T extends { files: { write: unknown } }>(ctx: T) {
  const written: { fileName: string; data: Buffer }[] = [];
  const write = async ({ fileName, data }: { fileName: string; data: Buffer }) => {
    written.push({ fileName, data });
    return `https://files.test/${fileName}`;
  };
  return { ctx: { ...ctx, files: { ...ctx.files, write } }, written };
}

describe('delimiter detection', () => {
  test.each([
    ['semicolon.csv', ';'],
    ['tab.tsv', '\t'],
    ['pipe.csv', '|'],
    ['people.csv', ','],
    ['quoted-multiline.csv', ','],
  ])('%s → %j', (name, expected) => {
    expect(csvUtils.detectDelimiter(fixtureText(name))).toBe(expected);
  });

  test('ignores delimiters inside quoted values', () => {
    expect(csvUtils.detectDelimiter('a;b\n"x,y,z";1\n"p,q";2\n')).toBe(';');
  });

  test('falls back to comma for a single column', () => {
    expect(csvUtils.detectDelimiter('name\nAnn\nBob\n')).toBe(',');
  });
});

describe('read_csv_file', () => {
  const run = (propsValue: Record<string, unknown>) =>
    readCsvFileAction.run(createMockActionContext({ propsValue: propsValue }));

  test('strips the BOM, handles CRLF and keeps accents', async () => {
    const out = await run({ file: asFile('bom-utf8.csv') });
    expect(out.headers).toEqual(['name', 'city']);
    expect(out.rows).toEqual([
      { name: 'José', city: 'Zürich' },
      { name: 'Renée', city: 'Köln' },
    ]);
    expect(out.row_count).toBe(2);
  });

  test('auto-detects semicolons and keeps decimal commas and quoted semicolons', async () => {
    const out = await run({ file: asFile('semicolon.csv'), delimiter: 'auto' });
    expect(out.delimiter).toBe(';');
    expect(out.rows[0]).toEqual({ name: 'Ann', amount: '1,50', note: 'a;b' });
  });

  test('explicit delimiter overrides detection', async () => {
    const out = await run({ file: asFile('semicolon.csv'), delimiter: ',' });
    expect(out.headers).toEqual(['name;amount;note', 'column_2']);
  });

  test('skips blank and delimiter-only lines anywhere', async () => {
    const out = await run({ file: asFile('blank-lines.csv') });
    expect(out.rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
      { a: '5', b: '6' },
    ]);
  });

  test('ragged rows: short rows padded, extra cells kept in a new column', async () => {
    const out = await run({ file: asFile('ragged.csv') });
    expect(out.headers).toEqual(['id', 'name', 'email', 'column_4']);
    expect(out.rows[0]).toEqual({ id: '1', name: 'Ann', email: '', column_4: '' });
    expect(out.rows[1].column_4).toBe('EXTRA');
  });

  test('duplicate and blank headers are renamed, never overwritten', async () => {
    const out = await run({ file: asFile('dup-headers.csv') });
    expect(out.headers).toEqual(['email', 'name', 'email_2', 'column_4', 'name_2']);
    expect(out.rows[0]).toEqual({
      email: 'ann@x.com',
      name: 'Ann',
      email_2: 'ann@work.com',
      column_4: 'note',
      name_2: 'Annie',
    });
  });

  test('quoted multi-line values, escaped quotes and stray quotes', async () => {
    const out = await run({ file: asFile('quoted-multiline.csv') });
    expect(out.rows.map((r) => r.comment)).toEqual([
      'line one\nline two',
      'he said "hi", then left',
      'plain "quote" inside',
    ]);
  });

  test('no header row → column_N keys', async () => {
    const out = await run({ file: asFile('tab.tsv'), has_header_row: false });
    expect(out.headers).toEqual(['column_1', 'column_2', 'column_3']);
    expect(out.rows[0]).toEqual({ column_1: 'name', column_2: 'age', column_3: 'city' });
    expect(out.row_count).toBe(3);
  });

  test('decodes UTF-16 LE (Excel "Unicode Text") and UTF-16 BE', async () => {
    const le = await run({ file: asFile('excel-unicode-text.txt') });
    expect(le.delimiter).toBe('\t');
    expect(le.rows).toEqual([{ name: 'José', city: 'Zürich' }]);
    const be = await run({ file: asFile('utf16be.csv') });
    expect(be.rows).toEqual([{ name: 'José', city: 'Zürich' }]);
  });

  test('accepts a base64-only file object (duck-typed)', async () => {
    const out = await run({ file: { filename: 'x.csv', base64: fixture('pipe.csv').toString('base64') } });
    expect(out.rows[0]).toEqual({ sku: 'A1', price: '9.99', name: 'Widget, large' });
  });

  test('trim option', async () => {
    const out = await run({ file: asFile('people.csv'), trim_whitespace: true });
    expect(out.rows[4].email).toBe('eve@x.com');
  });

  test('rejects an Excel file with a pointer to Convert Excel to CSV', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a']]), 'S');
    const data: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    await expect(run({ file: { filename: 'x.xlsx', data } })).rejects.toThrow(/Convert Excel to CSV/);
  });

  test('missing file and empty file', async () => {
    await expect(run({ file: undefined })).rejects.toThrow(/No file was provided/);
    const out = await run({ file: { filename: 'e.csv', data: Buffer.from('\n\n') } });
    expect(out).toEqual({ rows: [], row_count: 0, headers: [], delimiter: ',' });
  });

  test('enforces the size limit', async () => {
    const data = Buffer.alloc(21 * 1024 * 1024, 'a');
    await expect(run({ file: { filename: 'big.csv', data } })).rejects.toThrow(/larger than 20 MB/);
  });
});

describe('create_csv_file', () => {
  const run = async (propsValue: Record<string, unknown>) => {
    const { ctx, written } = withFileCapture(createMockActionContext({ propsValue: propsValue }));
    const out = await createCsvFileAction.run(ctx);
    return { out, written };
  };

  test('union of columns, booleans true/false, null blank, nested flattened', async () => {
    const { out, written } = await run({
      json_array: [
        { name: 'Ann', paid: true, address: { city: 'Paris' } },
        { name: 'Bob', paid: false, extra: null, tags: [] },
        { name: 'Cy "Q"', note: 'a,b\nc' },
      ],
    });
    expect(out.columns).toEqual(['name', 'paid', 'address.city', 'extra', 'tags', 'note']);
    expect(written[0].data.toString('utf8')).toBe(
      'name,paid,address.city,extra,tags,note\n' +
        'Ann,true,Paris,,,\n' +
        'Bob,false,,,,\n' +
        '"Cy ""Q""",,,,,"a,b\nc"\n',
    );
    expect(out).toMatchObject({ file_name: 'export.csv', url: 'https://files.test/export.csv', row_count: 3 });
  });

  test('explicit columns, semicolon, no header, Excel BOM, extension added', async () => {
    const { out, written } = await run({
      json_array: [{ a: 1, b: 2, c: 3 }],
      columns: ['c', 'a', 'missing'],
      delimiter: ';',
      include_header: false,
      add_excel_bom: true,
      file_name: 'reports/q3',
    });
    expect(out.file_name).toBe('reports_q3.csv');
    expect(written[0].data.toString('utf8')).toBe('﻿3;1;\n');
  });

  test('accepts a JSON string and rejects non-arrays / non-object rows', async () => {
    const { out } = await run({ json_array: '[{"x":1}]' });
    expect(out.row_count).toBe(1);
    await expect(run({ json_array: { x: 1 } })).rejects.toThrow(/not a single object/);
    await expect(run({ json_array: [{ x: 1 }, 'oops'] })).rejects.toThrow(/Row 2 is not an object/);
    await expect(run({ json_array: '{bad' })).rejects.toThrow(/must be a JSON array/);
  });

  test('round-trips through read_csv_file', async () => {
    const { written } = await run({ json_array: [{ name: 'José', note: 'x;y' }], add_excel_bom: true });
    const back = await readCsvFileAction.run(
      createMockActionContext({ propsValue: { file: { filename: 'r.csv', data: written[0].data } } }),
    );
    expect(back.rows).toEqual([{ name: 'José', note: 'x;y' }]);
  });
});

describe('convert_csv_to_excel', () => {
  const run = async (propsValue: Record<string, unknown>) => {
    const { ctx, written } = withFileCapture(createMockActionContext({ propsValue: propsValue }));
    const out = await convertCsvToExcelAction.run(ctx);
    const sheet = XLSX.read(written[0].data, { type: 'buffer' });
    return { out, sheet, written };
  };

  test('keeps leading zeros and long ids as text, stores safe numbers as numbers', async () => {
    const { out, sheet } = await run({ csv_text: fixtureText('leading-zeros.csv') });
    const ws = sheet.Sheets['Sheet1'];
    expect(ws['A2']).toMatchObject({ t: 's', v: '01234' });
    expect(ws['B2']).toMatchObject({ t: 's', v: '12345678901234567890' });
    expect(ws['B3']).toMatchObject({ t: 's', v: '9007199254740993' });
    expect(ws['C2']).toMatchObject({ t: 'n', v: 42.5 });
    expect(ws['D2']).toMatchObject({ t: 's', v: 'TRUE' });
    expect(ws['E2']).toMatchObject({ t: 'n', v: -3 });
    expect(out).toEqual({
      file_name: 'data.xlsx',
      url: 'https://files.test/data.xlsx',
      row_count: 3,
      sheet_name: 'Sheet1',
    });
  });

  test('detect_numbers off keeps every cell as text', async () => {
    const { sheet } = await run({ csv_text: fixtureText('leading-zeros.csv'), detect_numbers: false });
    expect(sheet.Sheets['Sheet1']['C2']).toMatchObject({ t: 's', v: '42.5' });
  });

  test('semicolon input, custom sheet and file name, xlsx signature', async () => {
    const { out, sheet, written } = await run({
      csv_text: fixtureText('semicolon.csv'),
      sheet_name: 'Orders',
      file_name: 'orders',
    });
    expect(out.file_name).toBe('orders.xlsx');
    expect(sheet.SheetNames).toEqual(['Orders']);
    expect(sheet.Sheets['Orders']['B2']).toMatchObject({ v: '1,50' });
    expect(written[0].data[0]).toBe(0x50);
  });

  test('rejects invalid sheet names', async () => {
    await expect(run({ csv_text: 'a\n1', sheet_name: 'Q3/2026' })).rejects.toThrow(/not a valid sheet name/);
    await expect(run({ csv_text: 'a\n1', sheet_name: 'x'.repeat(32) })).rejects.toThrow(/not a valid sheet name/);
  });
});

describe('filter_csv_rows', () => {
  const people = fixtureText('people.csv');
  const names = async (propsValue: Record<string, unknown>) => {
    const out = await filterCsvRowsAction.run(
      createMockActionContext({ propsValue: { csv_text: people, ...propsValue } }),
    );
    return out.rows.map((r) => r.name);
  };

  test('equals is case-insensitive by default, sensitive on request', async () => {
    expect(await names({ column: 'status', condition: 'equals', value: 'paid' })).toEqual(['Ann', 'bob', 'Eve']);
    expect(await names({ column: 'status', condition: 'equals', value: 'paid', case_sensitive: true })).toEqual(['bob']);
  });

  test('numbers compare as numbers (10 > 9), blanks excluded', async () => {
    expect(await names({ column: 'age', condition: 'greater_than', value: '9' })).toEqual(['Ann', 'Cy', 'Eve']);
    expect(await names({ column: 'age', condition: 'less_or_equal', value: '10' })).toEqual(['bob', 'Cy']);
  });

  test('text conditions and emptiness', async () => {
    expect(await names({ column: 'email', condition: 'contains', value: 'ANN@' })).toEqual(['Ann', 'Dee']);
    expect(await names({ column: 'email', condition: 'ends_with', value: 'x.com' })).toHaveLength(5);
    expect(await names({ column: 'name', condition: 'starts_with', value: 'd' })).toEqual(['Dee']);
    expect(await names({ column: 'status', condition: 'not_contains', value: 'paid' })).toEqual(['Cy', 'Dee']);
    expect(await names({ column: 'joined', condition: 'is_empty' })).toEqual(['Cy']);
    expect(await names({ column: 'age', condition: 'is_not_empty' })).toHaveLength(4);
    expect(await names({ column: 'status', condition: 'not_equals', value: 'trial' })).toEqual(['Ann', 'bob', 'Eve']);
  });

  test('column matched case-insensitively; missing column lists the real ones', async () => {
    expect(await names({ column: 'STATUS', condition: 'equals', value: 'trial' })).toEqual(['Cy', 'Dee']);
    await expect(names({ column: 'plan', condition: 'equals', value: 'x' })).rejects.toThrow(
      'Column "plan" not found. Available columns: name, email, age, status, joined',
    );
  });

  test('value required for comparisons', async () => {
    await expect(names({ column: 'age', condition: 'greater_than' })).rejects.toThrow(/Enter a value/);
  });

  test('csv output keeps the input delimiter', async () => {
    const out = await filterCsvRowsAction.run(
      createMockActionContext({
        propsValue: { csv_text: fixtureText('semicolon.csv'), column: 'name', condition: 'equals', value: 'Ann' },
      }),
    );
    expect(out.csv).toBe('name;amount;note\nAnn;1,50;"a;b"\n');
    expect(out.row_count).toBe(1);
  });
});

describe('sort_csv_rows', () => {
  const people = fixtureText('people.csv');
  const names = async (propsValue: Record<string, unknown>) => {
    const out = await sortCsvRowsAction.run(
      createMockActionContext({ propsValue: { csv_text: people, ...propsValue } }),
    );
    return out.rows.map((r) => r.name);
  };

  test('number sort, blanks last in both directions', async () => {
    expect(await names({ column: 'age', compare_as: 'number' })).toEqual(['bob', 'Cy', 'Ann', 'Eve', 'Dee']);
    expect(await names({ column: 'age', compare_as: 'number', direction: 'desc' })).toEqual(['Eve', 'Ann', 'Cy', 'bob', 'Dee']);
  });

  test('text sort is natural and case-insensitive', async () => {
    expect(await names({ column: 'age' })).toEqual(['bob', 'Cy', 'Ann', 'Eve', 'Dee']);
    expect(await names({ column: 'name' })).toEqual(['Ann', 'bob', 'Cy', 'Dee', 'Eve']);
  });

  test('date sort, unreadable dates last', async () => {
    expect(await names({ column: 'joined', compare_as: 'date', direction: 'desc' })).toEqual(['Dee', 'Ann', 'bob', 'Cy', 'Eve']);
  });

  test('stable for equal keys', async () => {
    expect(await names({ column: 'email' })).toEqual(['Ann', 'Dee', 'bob', 'Cy', 'Eve']);
  });
});

describe('remove_duplicate_csv_rows', () => {
  const run = (propsValue: Record<string, unknown>) =>
    removeDuplicateCsvRowsAction.run(createMockActionContext({ propsValue: propsValue }));

  test('whole-row duplicates (trim on by default)', async () => {
    const out = await run({ csv_text: 'a,b\n1,2\n1, 2\n3,4\n1,2\n' });
    expect(out.rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
    expect(out.removed_count).toBe(2);
  });

  test('key columns, case-insensitive, keep last', async () => {
    const out = await run({
      csv_text: fixtureText('people.csv'),
      key_columns: ['email'],
      case_sensitive: false,
      keep: 'last',
    });
    expect(out.rows.map((r) => r.name)).toEqual(['bob', 'Cy', 'Dee', 'Eve']);
    expect(out.removed_count).toBe(1);
  });

  test('case-sensitive by default', async () => {
    const out = await run({ csv_text: 'e\nA\na\n' });
    expect(out.removed_count).toBe(0);
  });

  test('unknown key column errors', async () => {
    await expect(run({ csv_text: 'a\n1', key_columns: ['nope'] })).rejects.toThrow(/Column "nope" not found/);
  });
});

describe('select_csv_columns', () => {
  const run = (propsValue: Record<string, unknown>) =>
    selectCsvColumnsAction.run(createMockActionContext({ propsValue: propsValue }));

  test('keep + reorder', async () => {
    const out = await run({ csv_text: fixtureText('people.csv'), columns: ['email', 'name'] });
    expect(out.headers).toEqual(['email', 'name']);
    expect(out.csv.split('\n')[1]).toBe('ann@x.com,Ann');
  });

  test('remove mode', async () => {
    const out = await run({ csv_text: fixtureText('people.csv'), columns: ['age', 'joined'], mode: 'remove' });
    expect(out.headers).toEqual(['name', 'email', 'status']);
  });

  test('errors for no columns or unknown columns', async () => {
    await expect(run({ csv_text: 'a\n1', columns: [] })).rejects.toThrow(/at least one column/);
    await expect(run({ csv_text: 'a\n1', columns: ['b'] })).rejects.toThrow(/Available columns: a/);
  });
});

describe('merge_csv', () => {
  const run = (propsValue: Record<string, unknown>) =>
    mergeCsvAction.run(createMockActionContext({ propsValue: propsValue }));

  test('union of headers in first-seen order, blanks filled, mixed delimiters auto-detected', async () => {
    const out = await run({
      csv_texts: ['name;email\nAnn;ann@x.com\n', fixtureText('extra-columns.csv')],
    });
    expect(out.headers).toEqual(['name', 'email', 'country']);
    expect(out.rows).toEqual([
      { name: 'Ann', email: 'ann@x.com', country: '' },
      { name: 'Zed', email: 'zed@x.com', country: 'DE' },
    ]);
    expect(out.csv).toBe('name;email;country\nAnn;ann@x.com;\nZed;zed@x.com;DE\n');
  });

  test('needs at least two inputs; non-text input errors with its position', async () => {
    await expect(run({ csv_texts: ['a\n1'] })).rejects.toThrow(/at least two/);
    await expect(run({ csv_texts: ['a\n1', 5] })).rejects.toThrow(/CSV Text 2 must be text/);
  });
});

describe('split_csv', () => {
  const rows250 = ['id,name', ...Array.from({ length: 250 }, (_, i) => `${i + 1},n${i + 1}`)].join('\n');
  const run = (propsValue: Record<string, unknown>) =>
    splitCsvAction.run(createMockActionContext({ propsValue: propsValue }));

  test('250 rows / 100 → 100, 100, 50 with header repeated', async () => {
    const out = await run({ csv_text: rows250, rows_per_chunk: 100 });
    expect(out.chunk_count).toBe(3);
    expect(out.total_rows).toBe(250);
    expect(out.chunks.map((c) => c.row_count)).toEqual([100, 100, 50]);
    expect(out.chunks[2].csv.startsWith('id,name\n201,n201\n')).toBe(true);
    expect(out.chunks.map((c) => c.index)).toEqual([1, 2, 3]);
  });

  test('header only on the first chunk when repeat is off; string number accepted', async () => {
    const out = await run({ csv_text: rows250, rows_per_chunk: '200', repeat_header: false });
    expect(out.chunks[0].csv.startsWith('id,name\n')).toBe(true);
    expect(out.chunks[1].csv.startsWith('201,n201\n')).toBe(true);
  });

  test('validates rows_per_chunk', async () => {
    await expect(run({ csv_text: rows250, rows_per_chunk: 0 })).rejects.toThrow(/whole number/);
    await expect(run({ csv_text: rows250, rows_per_chunk: 2.5 })).rejects.toThrow(/whole number/);
    await expect(run({ csv_text: rows250, rows_per_chunk: 10001 })).rejects.toThrow(/whole number/);
  });
});

describe('limits', () => {
  test('row limit points to Stream CSV to Subflows', async () => {
    const big = ['a', ...Array.from({ length: 100_001 }, () => '1')].join('\n');
    await expect(
      filterCsvRowsAction.run(
        createMockActionContext({ propsValue: { csv_text: big, column: 'a', condition: 'is_empty' } }),
      ),
    ).rejects.toThrow(/up to 100000.*Stream CSV to Subflows/);
  });
});

describe('review fixes', () => {
  const readText = async ({ text, hasHeader }: { text: string; hasHeader: boolean }) =>
    readCsvFileAction.run(
      createMockActionContext({
        propsValue: { file: { filename: 'r.csv', data: Buffer.from(text) }, has_header_row: hasHeader },
      }),
    );
  const excel = async (propsValue: Record<string, unknown>) => {
    const { ctx, written } = withFileCapture(createMockActionContext({ propsValue }));
    const out = await convertCsvToExcelAction.run(ctx);
    return { out, ws: XLSX.read(written[0].data, { type: 'buffer' }).Sheets['Sheet1'] };
  };
  const createCsv = async (propsValue: Record<string, unknown>) => {
    const { ctx, written } = withFileCapture(createMockActionContext({ propsValue }));
    await createCsvFileAction.run(ctx);
    return written[0].data.toString('utf8');
  };

  test('create_csv_file prefixes formula-like text by default and leaves numbers alone', async () => {
    const csv = await createCsv({
      json_array: [
        { a: '=HYPERLINK("http://x","y")', b: '@SUM(1)', c: '+1+1', d: '-5', e: '-1+2', f: 'plain', g: -3 },
      ],
    });
    expect(csv.split('\n')[1]).toBe(`"'=HYPERLINK(""http://x"",""y"")",'@SUM(1),'+1+1,-5,'-1+2,plain,-3`);
  });

  test('create_csv_file escapes formula-like headers too', async () => {
    const csv = await createCsv({ json_array: [{ '=cmd': 'x' }] });
    expect(csv.split('\n')[0]).toBe("'=cmd");
  });

  test('create_csv_file writes values unchanged when protection is off', async () => {
    const csv = await createCsv({ json_array: [{ a: '=1+1' }], escape_formulas: false });
    expect(csv.split('\n')[1]).toBe('=1+1');
  });

  test('convert_csv_to_excel keeps numbers that would lose precision as text', async () => {
    const { ws } = await excel({ csv_text: 'a,b,c\n99999999999999.999999999999999,1234567890.12345,0.10\n' });
    expect(ws['A2']).toMatchObject({ t: 's', v: '99999999999999.999999999999999' });
    expect(ws['B2']).toMatchObject({ t: 'n', v: 1234567890.12345 });
    expect(ws['C2']).toMatchObject({ t: 'n', v: 0.1 });
  });

  test('convert_csv_to_excel keeps numeric headings as text unless there is no header row', async () => {
    const withHeader = await excel({ csv_text: '2026,2027\n1,2\n' });
    expect(withHeader.ws['A1']).toMatchObject({ t: 's', v: '2026' });
    expect(withHeader.ws['A2']).toMatchObject({ t: 'n', v: 1 });
    const noHeader = await excel({ csv_text: '2026,2027\n1,2\n', has_header_row: false });
    expect(noHeader.ws['A1']).toMatchObject({ t: 'n', v: 2026 });
  });

  test('headerless files count every row against the limit', async () => {
    const rows = Array.from({ length: 100_001 }, () => '1').join('\n');
    await expect(readText({ text: rows, hasHeader: false })).rejects.toThrow(/has 100001 rows/);
    const withHeader = await readText({ text: `a\n${rows}`.split('\n').slice(0, 100_001).join('\n'), hasHeader: true });
    expect(withHeader.row_count).toBe(100_000);
    await expect(excel({ csv_text: rows, has_header_row: false })).rejects.toThrow(/has 100001 rows/);
  });

  test('wide duplicate headers are renamed in linear time', () => {
    const raw = Array.from({ length: 50_000 }, () => 'a');
    const started = Date.now();
    const headers = csvUtils.normalizeHeaders({ raw, width: raw.length });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(headers.slice(0, 3)).toEqual(['a', 'a_2', 'a_3']);
    expect(headers[49_999]).toBe('a_50000');
    expect(new Set(headers).size).toBe(50_000);
  });

  test('renaming still skips names that already exist', () => {
    expect(csvUtils.normalizeHeaders({ raw: ['email', 'email', 'email_2', '', 'name'], width: 6 })).toEqual([
      'email',
      'email_2',
      'email_2_2',
      'column_4',
      'name',
      'column_6',
    ]);
  });
});
