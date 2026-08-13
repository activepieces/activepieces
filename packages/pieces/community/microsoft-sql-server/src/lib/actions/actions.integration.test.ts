import { AppConnectionType } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mssqlCommon } from '../common';
import { deleteRowsAction } from './delete-rows';
import { findRowsAction } from './find-rows';
import { getTablesAction } from './get-tables';
import { insertRowAction } from './insert-row';
import { runQueryAction } from './run-query';
import { updateRowsAction } from './update-rows';

const connectionString = process.env['AP_MSSQL_TEST_CONNECTION_STRING'];
const host = process.env['AP_MSSQL_TEST_HOST'];
const enabled = Boolean(connectionString ?? host);

const TABLE_PREFIX = 'ap_action_test_';
const DATABASE = process.env['AP_MSSQL_TEST_DATABASE'] ?? 'ap_action_test';

const auth = {
  type: AppConnectionType.CUSTOM_AUTH as const,
  props: {
    connection_string: connectionString,
    host,
    port: Number(process.env['AP_MSSQL_TEST_PORT'] ?? 1433),
    database: DATABASE,
    user: process.env['AP_MSSQL_TEST_USER'] ?? 'sa',
    password: process.env['AP_MSSQL_TEST_PASSWORD'],
    encrypt: true,
    trust_server_certificate: true,
    certificate: undefined,
    min_tls_version: undefined,
  },
};

type Row = Record<string, unknown>;
type Table = { table_schema: string; table_name: string };
type RunContext = never;

let pool: sql.ConnectionPool;
const created: Table[] = [];

function nextTable(): Table {
  const table = {
    table_schema: 'dbo',
    table_name: `${TABLE_PREFIX}${created.length + 1}`,
  };
  created.push(table);
  return table;
}

function quoted(table: Table): string {
  return `[${table.table_schema}].[${table.table_name}]`;
}

async function exec(statement: string): Promise<void> {
  await pool.request().batch(statement);
}

async function createTable(table: Table, columns: string): Promise<void> {
  await exec(`CREATE TABLE ${quoted(table)} (${columns});`);
}

function run<T>(action: { run: (context: RunContext) => Promise<T> }, propsValue: Row) {
  return action.run({ auth, propsValue } as unknown as RunContext);
}

async function seeded(): Promise<Table> {
  const table = nextTable();
  await createTable(
    table,
    `id int IDENTITY(1,1) PRIMARY KEY,
     name nvarchar(100) NOT NULL,
     balance decimal(19,4) NOT NULL,
     seen_at datetime2(7) NOT NULL,
     legacy_at datetime NULL`
  );
  await exec(
    `INSERT INTO ${quoted(table)} (name, balance, seen_at, legacy_at) VALUES
       (N'ada',   12345678901.1234, '2030-01-01T00:00:00.1234567', '2030-01-01T00:00:00.003'),
       (N'grace', 2.5000,           '2030-01-02T00:00:00.7654321', NULL),
       (N'linus', 0.0001,           '2030-01-03T00:00:00.0000001', NULL);`
  );
  return table;
}

describe.skipIf(!enabled)('actions, against a live server', () => {
  beforeAll(async () => {
    if (!connectionString) {
      const bootstrap = await mssqlCommon.connect({
        auth: { ...auth, props: { ...auth.props, database: 'master' } },
      });
      try {
        await bootstrap
          .request()
          .input('name', DATABASE)
          .query(
            `IF DB_ID(@name) IS NULL
             BEGIN
               DECLARE @create nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(@name);
               EXEC sp_executesql @create;
             END;`
          );
      } finally {
        await bootstrap.close();
      }
    }
    pool = await mssqlCommon.connect({ auth });
  }, 180_000);

  afterAll(async () => {
    if (!pool) return;
    for (const table of created) {
      await exec(
        `IF OBJECT_ID('${quoted(table)}', 'U') IS NOT NULL DROP TABLE ${quoted(
          table
        )};`
      ).catch(() => undefined);
    }
    await pool.close();
  }, 120_000);

  it('get_tables lists a table that was just created', async () => {
    const table = await seeded();
    const rows = (await run(getTablesAction, {})) as Row[];
    expect(Array.isArray(rows)).toBe(true);
    expect(
      rows.some((row) => row['full_name'] === `dbo.${table.table_name}`)
    ).toBe(true);
  }, 120_000);

  it('insert_row returns the stored row with exact values, not rounded ones', async () => {
    const table = await seeded();
    const row = (await run(insertRowAction, {
      table,
      values: {
        name: 'hopper',
        balance: '98765432109.8765',
        seen_at: '2030-02-01T00:00:00.7654321',
      },
    })) as Row;
    expect(row['name']).toBe('hopper');
    expect(row['balance']).toBe('98765432109.8765');
    expect(row['seen_at']).toBe('2030-02-01T00:00:00.7654321');
    expect(Number(row['id'])).toBeGreaterThan(0);
  }, 120_000);

  it('insert_row refuses an empty value map', async () => {
    const table = await seeded();
    await expect(run(insertRowAction, { table, values: {} })).rejects.toThrow(
      /at least one column/
    );
  }, 120_000);

  it('find_rows filters on a parameterised condition without inlining the value', async () => {
    const table = await seeded();
    const rows = (await run(findRowsAction, {
      table,
      condition: 'name = @who',
      parameters: { who: 'grace' },
    })) as Row[];
    expect(rows).toHaveLength(1);
    expect(rows[0]['name']).toBe('grace');
    expect(rows[0]['balance']).toBe('2.5000');
  }, 120_000);

  it('find_rows honours column selection, ordering and limit', async () => {
    const table = await seeded();
    const rows = (await run(findRowsAction, {
      table,
      columns: ['name'],
      order_by: 'name',
      order_direction: 'DESC',
      limit: 2,
    })) as Row[];
    expect(rows.map((row) => row['name'])).toEqual(['linus', 'grace']);
    expect(Object.keys(rows[0])).toEqual(['name']);
  }, 120_000);

  it('find_rows rejects a limit that is not a whole number of 1 or more', async () => {
    const table = await seeded();
    await expect(
      run(findRowsAction, { table, limit: 0 })
    ).rejects.toThrow(/whole number/);
  }, 120_000);

  it('renders every rounding-prone date type as a string, not a JS Date', async () => {
    const table = await seeded();
    const rows = (await run(findRowsAction, {
      table,
      condition: 'legacy_at IS NOT NULL',
    })) as Row[];
    expect(rows).toHaveLength(1);
    expect(typeof rows[0]['seen_at']).toBe('string');
    expect(typeof rows[0]['legacy_at']).toBe('string');
  }, 120_000);

  it('update_rows returns the rows as they stand after the write', async () => {
    const table = await seeded();
    const result = (await run(updateRowsAction, {
      table,
      values: { balance: '7.0000' },
      search_column: 'name',
      search_value: 'ada',
    })) as { rows: Row[]; rows_affected: number };
    expect(result.rows_affected).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]['balance']).toBe('7.0000');
  }, 120_000);

  it('update_rows reports zero when nothing matches', async () => {
    const table = await seeded();
    const result = (await run(updateRowsAction, {
      table,
      values: { balance: '1.0000' },
      search_column: 'name',
      search_value: 'nobody',
    })) as { rows: Row[]; rows_affected: number };
    expect(result.rows_affected).toBe(0);
    expect(result.rows).toHaveLength(0);
  }, 120_000);

  it('delete_rows returns the rows that were removed', async () => {
    const table = await seeded();
    const result = (await run(deleteRowsAction, {
      table,
      search_column: 'name',
      search_value: 'linus',
    })) as { rows: Row[]; rows_affected: number };
    expect(result.rows_affected).toBe(1);
    expect(result.rows[0]['name']).toBe('linus');

    const left = (await run(findRowsAction, { table })) as Row[];
    expect(left.map((row) => row['name']).sort()).toEqual(['ada', 'grace']);
  }, 120_000);

  it('run_query keeps every result set of a multi-statement batch', async () => {
    const table = await seeded();
    const result = (await run(runQueryAction, {
      query: `SELECT name FROM ${quoted(
        table
      )} WHERE name = 'ada'; SELECT COUNT(*) AS total FROM ${quoted(table)};`,
    })) as {
      rows: Row[];
      result_sets: Row[][];
      row_count: number;
      rows_affected: number;
    };
    expect(result.result_sets).toHaveLength(2);
    expect(result.rows).toEqual(result.result_sets[0]);
    expect(result.rows[0]['name']).toBe('ada');
    expect(Number(result.result_sets[1][0]['total'])).toBe(3);
    expect(result.row_count).toBe(1);
  }, 120_000);

  it('run_query passes parameters separately from the statement text', async () => {
    const table = await seeded();
    const result = (await run(runQueryAction, {
      query: `SELECT name FROM ${quoted(table)} WHERE name = @who`,
      parameters: { who: 'grace' },
    })) as { rows: Row[]; row_count: number };
    expect(result.row_count).toBe(1);
    expect(result.rows[0]['name']).toBe('grace');
  }, 120_000);

  it('reads exact values back from a table whose name contains a dot', async () => {
    const table = { table_schema: 'dbo', table_name: `${TABLE_PREFIX}fin.2026` };
    created.push(table);
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY,
       balance decimal(19,4) NOT NULL,
       seen_at datetime2(7) NOT NULL`
    );
    await exec(
      `INSERT INTO ${quoted(
        table
      )} (balance, seen_at) VALUES (12345678901.1234, '2030-01-01T08:30:00.1234567');`
    );
    const rows = (await run(findRowsAction, { table })) as Row[];
    expect(rows[0]['balance']).toBe('12345678901.1234');
    expect(rows[0]['seen_at']).toBe('2030-01-01T08:30:00.1234567');
  }, 120_000);
});
