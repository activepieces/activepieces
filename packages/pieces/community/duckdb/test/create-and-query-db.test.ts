import { ApFile } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import { createAndQueryDB } from '../src/lib/actions/create-and-query-db';

function runAction(propsValue: Record<string, unknown>) {
  return createAndQueryDB.run({ propsValue } as never);
}

function table(overrides: Record<string, unknown>) {
  return { name: 't', data: [], schema: {}, ...overrides };
}

describe('JSON Data prop', () => {
  it('loads rows straight from the JSON Data array', async () => {
    const rows = await runAction({
      tables: [
        table({
          data: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }],
          schema: { id: 'INTEGER', name: 'VARCHAR' },
        }),
      ],
      query: 'SELECT * FROM t ORDER BY id',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
  });

  it('an explicit schema restricts the table to only the listed columns', async () => {
    const rows = await runAction({
      tables: [
        table({
          data: [{ id: 1, name: 'a', extra: 'dropped' }],
          schema: { id: 'INTEGER', name: 'VARCHAR' },
        }),
      ],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }]);
  });
});

describe('File prop (CSV/JSON)', () => {
  it('loads rows from an uploaded JSON file when JSON Data is empty', async () => {
    const file = new ApFile('rows.json', Buffer.from(JSON.stringify([{ id: 1, name: 'a' }])), 'json');

    const rows = await runAction({
      tables: [table({ data: [], file, schema: { id: 'INTEGER', name: 'VARCHAR' } })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }]);
  });

  it('loads rows from an uploaded CSV file, format detected from the extension', async () => {
    const file = new ApFile('rows.csv', Buffer.from('id,name\n1,a\n2,b\n'), 'csv');

    const rows = await runAction({
      tables: [table({ data: [], file, schema: { id: 'INTEGER', name: 'VARCHAR' } })],
      query: 'SELECT * FROM t ORDER BY id',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
  });

  it('strips a UTF-8 BOM from a CSV header instead of corrupting the first column name', async () => {
    const file = new ApFile('rows.csv', Buffer.from('﻿id,name\n1,a\n'), 'csv');

    const rows = await runAction({
      tables: [table({ data: [], file, schema: { id: 'INTEGER', name: 'VARCHAR' } })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }]);
  });

  it('a ragged CSV row does not abort the whole file', async () => {
    const file = new ApFile('rows.csv', Buffer.from('id,name\n1,a,extra\n2,b\n'), 'csv');

    const rows = await runAction({
      tables: [table({ data: [], file, schema: { id: 'INTEGER', name: 'VARCHAR' } })],
      query: 'SELECT * FROM t ORDER BY id',
    });

    expect(rows).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
  });

  it('JSON Data takes priority over the file when both are set', async () => {
    const file = new ApFile('rows.csv', Buffer.from('id,name\n99,ignored\n'), 'csv');

    const rows = await runAction({
      tables: [table({ data: [{ id: 1, name: 'from-data' }], file, schema: { id: 'INTEGER', name: 'VARCHAR' } })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, name: 'from-data' }]);
  });
});

describe('Nested schema and Flatten Nested Fields', () => {
  const NESTED_DATA = [{ id: 1, meta: { a: 'x', b: 2 }, tags: ['a', 'b'] }];
  const NESTED_SCHEMA = { id: 'INTEGER', meta: 'STRUCT(a VARCHAR, b INTEGER)', tags: 'VARCHAR[]' };

  it('flattens nested struct fields into top-level columns by default', async () => {
    const rows = await runAction({
      tables: [table({ data: NESTED_DATA, schema: NESTED_SCHEMA })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, a: 'x', b: 2, tags: ['a', 'b'] }]);
  });

  it('flattenNestedFields: false keeps the nested object as a single struct column', async () => {
    const rows = await runAction({
      tables: [table({ data: NESTED_DATA, schema: NESTED_SCHEMA, flattenNestedFields: false })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, meta: { a: 'x', b: 2 }, tags: ['a', 'b'] }]);
  });

  it('a schema/data shape mismatch silently nulls the column rather than erroring (known DuckDB behavior)', async () => {
    const rows = await runAction({
      tables: [
        table({
          data: [{ id: 1, meta: 'not-a-struct' }],
          schema: { id: 'INTEGER', meta: 'STRUCT(a VARCHAR, b INTEGER)' },
        }),
      ],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: 1, a: null, b: null }]);
  });
});

describe('Multiple tables', () => {
  it('loads more than one table and can join across them in a single query', async () => {
    const rows = await runAction({
      tables: [
        table({
          name: 'users',
          data: [{ id: 1, name: 'a' }],
          schema: { id: 'INTEGER', name: 'VARCHAR' },
        }),
        table({
          name: 'orders',
          data: [{ id: 10, user_id: 1, total: 5 }],
          schema: { id: 'INTEGER', user_id: 'INTEGER', total: 'INTEGER' },
        }),
      ],
      query: 'SELECT u.name, o.total FROM users u JOIN orders o ON o.user_id = u.id',
    });

    expect(rows).toEqual([{ name: 'a', total: 5 }]);
  });
});

describe('Schema autodetection (schema left at its default {})', () => {
  it('does not error on a fresh table row whose schema is still the default empty object, and autodetects types (note: integer columns come back as strings, since json_structure infers UBIGINT and getRowObjectsJson stringifies 64-bit ints to avoid precision loss)', async () => {
    const rows = await runAction({
      tables: [table({ data: [{ id: 1, name: 'a' }] })],
      query: 'SELECT * FROM t',
    });

    expect(rows).toEqual([{ id: '1', name: 'a' }]);
  });
});
