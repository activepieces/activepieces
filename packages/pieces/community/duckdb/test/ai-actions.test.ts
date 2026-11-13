import { describe, expect, it } from 'vitest';
import { duckdbCompareDatasets } from '../src/lib/actions/ai/compare/compare-datasets';
import { duckdbDeduplicateRows } from '../src/lib/actions/ai/compare/deduplicate-rows';
import { duckdbDescribeData } from '../src/lib/actions/ai/profile/describe-data';
import { duckdbRunQuery } from '../src/lib/actions/ai/query/run-query';

function runAction({
  action,
  propsValue,
}: {
  action: { run: unknown };
  propsValue: Record<string, unknown>;
}) {
  return Reflect.apply(Function.prototype.call, action.run, [
    action,
    { propsValue },
  ]);
}

describe('duckdb_run_query', () => {
  it('joins tables, binds scalar params and returns integers as numbers', async () => {
    const result = await runAction({
      action: duckdbRunQuery,
      propsValue: {
        tables: {
          orders: [
            { id: 1, customer_id: 1, total: 9.5 },
            { id: 2, customer_id: 1, total: 3 },
            { id: 3, customer_id: 2, total: 7.25 },
          ],
          customers: [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bo' }],
        },
        query:
          'SELECT c.name, count(*) AS n FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.total > $1 GROUP BY ALL ORDER BY c.name',
        params: [1],
      },
    });

    expect(result.rows).toEqual([{ name: 'Ann', n: 2 }, { name: 'Bo', n: 1 }]);
    expect(result.row_count).toBe(2);
  });

  it('binds null params', async () => {
    const result = await runAction({
      action: duckdbRunQuery,
      propsValue: {
        tables: { t: [{ a: 1 }] },
        query: 'SELECT $1 IS NULL AS is_null',
        params: [null],
      },
    });

    expect(result.rows).toEqual([{ is_null: true }]);
  });

  it('refuses file access', async () => {
    await expect(
      runAction({
        action: duckdbRunQuery,
        propsValue: {
          tables: { t: [{ a: 1 }] },
          query: "SELECT * FROM read_csv('/etc/passwd')",
        },
      })
    ).rejects.toThrow(/disabled/);
  });
});

describe('duckdb_describe_data', () => {
  it('keeps nested objects as STRUCT columns', async () => {
    const result = await runAction({
      action: duckdbDescribeData,
      propsValue: { rows: [{ id: 1, meta: { plan: 'pro' } }] },
    });

    expect(result.columns).toEqual([
      { name: 'id', type: 'UBIGINT' },
      { name: 'meta', type: 'STRUCT(plan VARCHAR)' },
    ]);
  });
});

describe('duckdb_compare_datasets', () => {
  it('splits rows into added, removed, changed and unchanged', async () => {
    const result = await runAction({
      action: duckdbCompareDatasets,
      propsValue: {
        before: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }],
        after: [{ id: 2, name: 'B' }, { id: 3, name: 'c' }, { id: 4, name: 'd' }],
        key_columns: ['id'],
      },
    });

    expect(result.added).toEqual([{ id: 4, name: 'd' }]);
    expect(result.removed).toEqual([{ id: 1, name: 'a' }]);
    expect(result.changed).toEqual([
      {
        key: { id: 2 },
        changed_columns: ['name'],
        before: { id: 2, name: 'b' },
        after: { id: 2, name: 'B' },
      },
    ]);
    expect(result.unchanged_count).toBe(1);
  });

  it('treats a nested key present as null as a change from a missing key', async () => {
    const result = await runAction({
      action: duckdbCompareDatasets,
      propsValue: {
        before: [{ id: 1, meta: { a: 1 } }],
        after: [{ id: 1, meta: { a: 1, b: null } }],
        key_columns: ['id'],
      },
    });

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changed_columns).toEqual(['meta']);
    expect(result.unchanged_count).toBe(0);
  });

  it('ignores key order inside nested objects', async () => {
    const result = await runAction({
      action: duckdbCompareDatasets,
      propsValue: {
        before: [{ id: 1, meta: { a: 1, b: 2 } }],
        after: [{ id: 1, meta: { b: 2, a: 1 } }],
        key_columns: ['id'],
      },
    });

    expect(result.changed).toEqual([]);
    expect(result.unchanged_count).toBe(1);
  });

  it('refuses a key that repeats within one side', async () => {
    await expect(
      runAction({
        action: duckdbCompareDatasets,
        propsValue: {
          before: [{ id: 1 }, { id: 1 }],
          after: [{ id: 1 }],
          key_columns: ['id'],
        },
      })
    ).rejects.toThrow(/more than one row/);
  });
});

describe('duckdb_deduplicate_rows', () => {
  const rows = [
    { email: 'a@example.com', n: 1 },
    { email: 'b@example.com', n: 2 },
    { email: 'a@example.com', n: 3 },
  ];

  it('keeps the first occurrence by default', async () => {
    const result = await runAction({
      action: duckdbDeduplicateRows,
      propsValue: { rows, key_columns: ['email'] },
    });

    expect(result.rows).toEqual([rows[0], rows[1]]);
    expect(result.removed_count).toBe(1);
  });

  it('keeps the last occurrence when asked', async () => {
    const result = await runAction({
      action: duckdbDeduplicateRows,
      propsValue: { rows, key_columns: ['email'], keep: 'last' },
    });

    expect(result.rows).toEqual([rows[1], rows[2]]);
  });

  it('keeps rows that differ only by a nested null', async () => {
    const result = await runAction({
      action: duckdbDeduplicateRows,
      propsValue: {
        rows: [{ meta: { a: 1 } }, { meta: { a: 1, b: null } }, { meta: { a: 1 } }],
        key_columns: [],
      },
    });

    expect(result.rows).toEqual([{ meta: { a: 1 } }, { meta: { a: 1, b: null } }]);
    expect(result.removed_count).toBe(1);
  });
});
