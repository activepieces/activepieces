import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { Connection } from 'promise-mysql';
import { mysqlAuth } from '../..';
import { mysqlConnect, sanitizeColumnName } from '.';

async function withConnection<T>({ auth, fn }: { auth: MysqlAuthValue; fn: (conn: Connection) => Promise<T> }): Promise<T> {
  const conn = await mysqlConnect(auth, {});
  conn.on('error', () => undefined);
  try {
    return await fn(conn);
  } finally {
    await conn.end().catch(() => conn.destroy());
  }
}

async function inTransaction<T>({ conn, readOnly, fn }: { conn: Connection; readOnly: boolean; fn: () => Promise<T> }): Promise<T> {
  await conn.query(readOnly ? 'START TRANSACTION READ ONLY' : 'START TRANSACTION');
  try {
    const result = await fn();
    await conn.query(readOnly ? 'ROLLBACK' : 'COMMIT');
    return result;
  } catch (error) {
    await conn.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

async function resolveDatabase({ conn, database }: { conn: Connection; database: string | undefined }): Promise<string> {
  if (database !== undefined && database !== '') {
    return database;
  }
  const rows: Record<string, unknown>[] = await conn.query('SELECT DATABASE() AS name');
  const name = rows[0]?.['name'];
  if (typeof name !== 'string') {
    throw new Error('No database selected: set Database, or set one on the connection.');
  }
  return name;
}

function buildWhere({ filters }: { filters: unknown }): SqlFragment {
  const parts = parseFilters({ filters }).map((filter) => filterToSql({ filter }));
  if (parts.length === 0) {
    return { sql: '', values: [] };
  }
  return {
    sql: ` WHERE ${parts.map((part) => part.sql).join(' AND ')}`,
    values: parts.flatMap((part) => part.values),
  };
}

function buildOrderBy({ sort }: { sort: unknown }): string {
  const entries = toList({ value: sort, label: 'Sort' });
  const parts = entries.map((entry, index) => {
    if (!isRecord(entry) || typeof entry['column'] !== 'string' || entry['column'] === '') {
      throw new Error(`Sort ${index + 1} needs a column.`);
    }
    const direction = String(entry['direction'] ?? 'ASC').toUpperCase();
    if (direction !== 'ASC' && direction !== 'DESC') {
      throw new Error(`Sort ${index + 1} direction must be ASC or DESC.`);
    }
    return `${sanitizeColumnName(entry['column'])} ${direction}`;
  });
  return parts.length > 0 ? ` ORDER BY ${parts.join(', ')}` : '';
}

function boundedInteger({ value, defaultValue, min, max, label }: {
  value: number | undefined;
  defaultValue: number;
  min: number;
  max: number;
  label: string;
}): number {
  const resolved = value ?? defaultValue;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return resolved;
}

function toBindValue({ value }: { value: unknown }): unknown {
  const isStructured = typeof value === 'object' && value !== null && !(value instanceof Date) && !Buffer.isBuffer(value);
  return isStructured ? JSON.stringify(value) : value;
}

function parseValues({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new Error(`${label} must be an object with at least one column name mapped to a value.`);
  }
  return value;
}

function buildSet({ values }: { values: Record<string, unknown> }): SqlFragment {
  const columns = Object.keys(values);
  return {
    sql: columns.map((column) => `${sanitizeColumnName(column)} = ?`).join(', '),
    values: columns.map((column) => toBindValue({ value: values[column] })),
  };
}

async function guardedWrite({ conn, quotedTable, where, maxRows, write, verb }: {
  conn: Connection;
  quotedTable: string;
  where: SqlFragment;
  maxRows: number;
  write: SqlFragment;
  verb: string;
}): Promise<MysqlOkPacket> {
  if (where.sql === '') {
    throw new Error(`Provide at least one filter; this action never ${verb} a whole table.`);
  }
  return inTransaction({
    conn,
    readOnly: false,
    fn: async () => {
      const rows: Record<string, unknown>[] = await conn.query(
        `SELECT COUNT(*) AS total FROM ${quotedTable}${where.sql} FOR UPDATE`,
        where.values,
      );
      const total = Number(rows[0]?.['total'] ?? 0);
      if (total > maxRows) {
        throw new Error(`The filters match ${total} rows, more than Max Rows (${maxRows}). Nothing was ${verb}; narrow the filters or raise Max Rows.`);
      }
      return conn.query(write.sql, write.values);
    },
  });
}

function assertReadOnlyQuery({ query }: { query: string }): void {
  if (query.includes('/*!') || query.includes('/*+')) {
    throw new Error('Executable and optimizer-hint comments (/*! ... */, /*+ ... */) are not allowed here.');
  }
  const code = query.replace(LEADING_NOISE, '');
  const firstWord = (code.match(/^[A-Za-z]+/)?.[0] ?? '').toUpperCase();
  if (!READ_ONLY_FIRST_WORDS.includes(firstWord)) {
    throw new Error(`Only read-only statements are allowed here (${READ_ONLY_FIRST_WORDS.join(', ')}); the query starts with "${firstWord || code.slice(0, 20)}". Use Run Query or the row actions to change data.`);
  }
  if (/\bINTO\s+(OUTFILE|DUMPFILE)\b/i.test(code)) {
    throw new Error('SELECT ... INTO OUTFILE / DUMPFILE is not allowed here.');
  }
}

function queryCapped({ conn, sql, values, max }: { conn: Connection; sql: string; values: unknown[]; max: number }): Promise<CappedRows> {
  return new Promise((resolve, reject) => {
    const rows: unknown[] = [];
    let hasMore = false;
    const query = conn.queryStream(sql, values);
    query.on('result', (row: unknown) => {
      if (rows.length < max) {
        rows.push(row);
      } else {
        hasMore = true;
      }
    });
    query.on('error', reject);
    query.on('end', () => resolve({ rows, hasMore }));
  });
}

function parseFilters({ filters }: { filters: unknown }): Filter[] {
  return toList({ value: filters, label: 'Filters' }).map((entry, index) => {
    if (!isRecord(entry) || typeof entry['column'] !== 'string' || entry['column'] === '') {
      throw new Error(`Filter ${index + 1} needs a column.`);
    }
    const operator = String(entry['operator'] ?? '=').toUpperCase();
    if (!isFilterOperator(operator)) {
      throw new Error(`Filter ${index + 1} operator "${operator}" is not supported. Use one of: ${FILTER_OPERATORS.join(', ')}.`);
    }
    return { column: entry['column'], operator, value: entry['value'] };
  });
}

function filterToSql({ filter }: { filter: Filter }): SqlFragment {
  const column = sanitizeColumnName(filter.column);
  if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
    return { sql: `${column} ${filter.operator}`, values: [] };
  }
  if (filter.value === undefined || filter.value === null || filter.value === '') {
    throw new Error(`Filter on "${filter.column}" with ${filter.operator} needs a value. Use IS NULL to match empty values.`);
  }
  if (filter.operator === 'IN' || filter.operator === 'NOT IN') {
    const list = Array.isArray(filter.value) ? filter.value : String(filter.value).split(',').map((item) => item.trim());
    return { sql: `${column} ${filter.operator} (${list.map(() => '?').join(', ')})`, values: list };
  }
  return { sql: `${column} ${filter.operator} ?`, values: [toBindValue({ value: filter.value })] };
}

function toList({ value, label }: { value: unknown; label: string }): unknown[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilterOperator(value: string): value is FilterOperator {
  return FILTER_OPERATORS.some((operator) => operator === value);
}

const FILTER_OPERATORS = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'] as const;

const READ_ONLY_FIRST_WORDS = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'TABLE', 'VALUES'];

const LEADING_NOISE = /^(?:\s+|\/\*[\s\S]*?\*\/|--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\()*/;

const READ_DEFAULT_LIMIT = 100;
const READ_MAX_LIMIT = 1000;
const WRITE_GUARD_DEFAULT = 100;
const WRITE_GUARD_MAX = 10000;

export const mysqlAi = {
  withConnection,
  inTransaction,
  resolveDatabase,
  buildWhere,
  buildOrderBy,
  buildSet,
  boundedInteger,
  toBindValue,
  parseValues,
  guardedWrite,
  assertReadOnlyQuery,
  queryCapped,
  isRecord,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
  WRITE_GUARD_DEFAULT,
  WRITE_GUARD_MAX,
};

export const mysqlAiProps = {
  table: Property.ShortText({
    displayName: 'Table',
    description: 'Table name, as returned by Get Tables. Use database.table to reach a table outside the connection database.',
    required: true,
  }),
  database: Property.ShortText({
    displayName: 'Database',
    description: 'Database name, as returned by List Databases. Leave empty to use the connection database.',
    required: false,
  }),
  namePattern: Property.ShortText({
    displayName: 'Name Pattern',
    description: 'Optional SQL LIKE pattern on the name, e.g. %order%. Leave empty to list all.',
    required: false,
  }),
  filters: ({ required }: { required: boolean }) =>
    Property.Array({
      displayName: 'Filters',
      description: `Conditions combined with AND. Each has a column, an operator (${FILTER_OPERATORS.join(', ')}) and a value. For IN / NOT IN pass a list or comma-separated values; IS NULL / IS NOT NULL take no value.${required ? ' At least one filter is required.' : ''}`,
      required,
      properties: {
        column: Property.ShortText({ displayName: 'Column', required: true }),
        operator: Property.StaticDropdown({
          displayName: 'Operator',
          required: true,
          defaultValue: '=',
          options: { options: FILTER_OPERATORS.map((operator) => ({ label: operator, value: operator })) },
        }),
        value: Property.ShortText({ displayName: 'Value', required: false }),
      },
    }),
  limit: Property.Number({
    displayName: 'Limit',
    description: `Maximum number of rows to return (1-${READ_MAX_LIMIT}). Defaults to ${READ_DEFAULT_LIMIT}.`,
    required: false,
    defaultValue: READ_DEFAULT_LIMIT,
  }),
  maxRows: ({ verb }: { verb: string }) =>
    Property.Number({
      displayName: 'Max Rows',
      description: `Refuse, changing nothing, if more rows than this would be ${verb} (1-${WRITE_GUARD_MAX}). Defaults to ${WRITE_GUARD_DEFAULT}.`,
      required: false,
      defaultValue: WRITE_GUARD_DEFAULT,
    }),
};

type MysqlAuthValue = AppConnectionValueForAuthProperty<typeof mysqlAuth>;

type FilterOperator = (typeof FILTER_OPERATORS)[number];

type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

type CappedRows = {
  rows: unknown[];
  hasMore: boolean;
};

export type SqlFragment = {
  sql: string;
  values: unknown[];
};

export type MysqlOkPacket = {
  affectedRows: number;
  insertId: number;
  changedRows: number;
  warningCount: number;
  message: string;
};
