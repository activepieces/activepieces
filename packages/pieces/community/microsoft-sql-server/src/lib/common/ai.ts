import { isNil, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { MssqlAuth, MssqlColumn, MssqlTable, mssqlCommon } from '.';
import { cursorUtils } from './cursor';

async function withPool<T>({
  auth,
  requestTimeoutMs,
  fn,
}: {
  auth: MssqlAuth;
  requestTimeoutMs?: number;
  fn: (pool: sql.ConnectionPool) => Promise<T>;
}): Promise<T> {
  const pool = await mssqlCommon.connect({ auth, requestTimeoutMs });
  pool.on('error', () => undefined);
  try {
    return await fn(pool);
  } finally {
    await pool.close().catch(() => undefined);
  }
}

async function withTransaction<T>({
  pool,
  fn,
}: {
  pool: sql.ConnectionPool;
  fn: (transaction: sql.Transaction) => Promise<T>;
}): Promise<T> {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await fn(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}

function qualifiedName({ schema, name }: { schema: string | undefined; name: string }): string {
  return isNil(schema) || schema === ''
    ? mssqlCommon.quoteId(name)
    : `${mssqlCommon.quoteId(schema)}.${mssqlCommon.quoteId(name)}`;
}

async function resolveObject({
  pool,
  schema,
  name,
  kinds,
  label,
}: {
  pool: sql.ConnectionPool;
  schema: string | undefined;
  name: string;
  kinds: readonly string[];
  label: string;
}): Promise<MssqlTable> {
  const result = await pool
    .request()
    .input('name', qualifiedName({ schema, name }))
    .query<Record<string, unknown>>(
      `SELECT SCHEMA_NAME(o.schema_id) AS table_schema, o.name AS table_name, RTRIM(o.type) AS type
       FROM sys.objects o WHERE o.object_id = OBJECT_ID(@name)`
    );
  const row = result.recordset[0];
  if (isNil(row) || !kinds.includes(String(row['type']))) {
    const where = isNil(schema) || schema === '' ? 'the default schema' : `schema "${schema}"`;
    throw new Error(`${label} "${name}" was not found in ${where}. ${HINTS[label] ?? ''}`.trim());
  }
  return { table_schema: String(row['table_schema']), table_name: String(row['table_name']) };
}

function boundedInteger({
  value,
  defaultValue,
  min,
  max,
  label,
}: {
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
  const isStructured =
    typeof value === 'object' && value !== null && !(value instanceof Date) && !Buffer.isBuffer(value);
  return isStructured ? JSON.stringify(value) : value ?? null;
}

function parseValues({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new Error(`${label} must be an object with at least one column name mapped to a value.`);
  }
  return value;
}

function bind({ request, params }: { request: sql.Request; params: Record<string, unknown> }): sql.Request {
  return Object.entries(params).reduce((req, [name, value]) => req.input(name, toBindValue({ value })), request);
}

function buildWhere({ filters }: { filters: unknown }): SqlFragment {
  const parts = parseFilters({ filters }).map((filter, index) => filterToSql({ filter, index }));
  if (parts.length === 0) {
    return { sql: '', params: {} };
  }
  return {
    sql: ` WHERE ${parts.map((part) => part.sql).join(' AND ')}`,
    params: Object.assign({}, ...parts.map((part) => part.params)),
  };
}

function buildSet({ values }: { values: Record<string, unknown> }): SqlFragment {
  const columns = Object.keys(values);
  return {
    sql: columns.map((column, index) => `${mssqlCommon.quoteId(column)} = @v${index}`).join(', '),
    params: Object.fromEntries(columns.map((column, index) => [`v${index}`, values[column]])),
  };
}

function buildOrderBy({ sort }: { sort: unknown }): string {
  const parts = toList({ value: sort, label: 'Sort' }).map((entry, index) => {
    if (!isRecord(entry) || typeof entry['column'] !== 'string' || entry['column'] === '') {
      throw new Error(`Sort ${index + 1} needs a column.`);
    }
    const direction = String(entry['direction'] ?? 'ASC').toUpperCase();
    if (direction !== 'ASC' && direction !== 'DESC') {
      throw new Error(`Sort ${index + 1} direction must be ASC or DESC.`);
    }
    return `${mssqlCommon.quoteId(entry['column'])} ${direction}`;
  });
  return parts.join(', ');
}

function projection({ columns, selected, prefix }: { columns: MssqlColumn[]; selected?: string[]; prefix?: string }): string {
  if (isNil(selected) || selected.length === 0) {
    return cursorUtils.exactProjection({ columns, prefix });
  }
  const byName = new Map(columns.map((column) => [column.name, column]));
  return selected
    .map((name) => {
      const column = byName.get(name);
      if (isNil(column)) {
        throw new Error(`Column "${name}" does not exist. Use Describe Table to list the columns.`);
      }
      return cursorUtils.exactColumn({ column, prefix });
    })
    .join(', ');
}

async function guardedWrite({
  pool,
  target,
  where,
  maxRows,
  verb,
  withOutput,
  withoutOutput,
  params,
}: {
  pool: sql.ConnectionPool;
  target: string;
  where: SqlFragment;
  maxRows: number;
  verb: string;
  withOutput: string;
  withoutOutput: string;
  params: Record<string, unknown>;
}): Promise<WriteResult> {
  if (where.sql === '') {
    throw new Error(`Provide at least one filter; this action never ${verb} a whole table.`);
  }
  return withTransaction({
    pool,
    fn: async (transaction) => {
      const counted = await bind({ request: transaction.request(), params: where.params }).query<Record<string, unknown>>(
        `SELECT COUNT_BIG(*) AS total FROM ${target} WITH (UPDLOCK, HOLDLOCK)${where.sql}`
      );
      const total = Number(counted.recordset[0]?.['total'] ?? 0);
      if (total > maxRows) {
        throw new Error(
          `The filters match ${total} rows, more than Max Rows (${maxRows}). Nothing was ${verb}; narrow the filters or raise Max Rows.`
        );
      }
      return mssqlCommon.writeReturningRows({
        bind: () => bind({ request: transaction.request(), params }),
        withOutput,
        withoutOutput,
      });
    },
  });
}

function assertReadOnlyQuery({ query }: { query: string }): void {
  const code = stripLiterals({ query });
  const firstWord = (code.trimStart().match(/^[A-Za-z]+/)?.[0] ?? '').toUpperCase();
  if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
    throw new Error(
      `Only a SELECT query (optionally starting with WITH) is allowed here; the query starts with "${firstWord || code.trim().slice(0, 20)}". Use Run Query or the row actions to change data.`
    );
  }
  const words = new Set((code.match(/[A-Za-z_]+/g) ?? []).map((word) => word.toUpperCase()));
  const blocked = WRITE_KEYWORDS.filter((keyword) => words.has(keyword));
  if (blocked.length > 0) {
    throw new Error(
      `The query contains ${blocked.join(', ')}, which is not allowed in a read-only query. Use Run Query to change data.`
    );
  }
}

function stripLiterals({ query }: { query: string }): string {
  return query
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/N?'(?:[^']|'')*'/g, "''")
    .replace(/\[(?:[^\]]|\]\])*\]/g, '[x]')
    .replace(/"(?:[^"]|"")*"/g, '[x]');
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

function filterToSql({ filter, index }: { filter: Filter; index: number }): SqlFragment {
  const column = mssqlCommon.quoteId(filter.column);
  if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
    return { sql: `${column} ${filter.operator}`, params: {} };
  }
  if (isNil(filter.value) || filter.value === '') {
    throw new Error(`Filter on "${filter.column}" with ${filter.operator} needs a value. Use IS NULL to match empty values.`);
  }
  if (filter.operator === 'IN' || filter.operator === 'NOT IN') {
    const list = Array.isArray(filter.value) ? filter.value : parseList({ text: String(filter.value) });
    if (list.length === 0) {
      throw new Error(`Filter on "${filter.column}" with ${filter.operator} needs at least one value.`);
    }
    const names = list.map((_, position) => `f${index}_${position}`);
    return {
      sql: `${column} ${filter.operator} (${names.map((name) => `@${name}`).join(', ')})`,
      params: Object.fromEntries(names.map((name, position) => [name, list[position]])),
    };
  }
  const operator = filter.operator === '!=' ? '<>' : filter.operator;
  return { sql: `${column} ${operator} @f${index}`, params: { [`f${index}`]: filter.value } };
}

function parseList({ text }: { text: string }): unknown[] {
  const parsed = text.trim().startsWith('[') ? parseJson({ text }) : undefined;
  return Array.isArray(parsed) ? parsed : text.split(',').map((item) => item.trim());
}

function parseJson({ text }: { text: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toList({ value, label }: { value: unknown; label: string }): unknown[] {
  if (isNil(value) || value === '') {
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

function typeLabel({ type, maxLength, precision, scale }: { type: string; maxLength: number; precision: number; scale: number }): string {
  const length = (bytes: number) => (bytes === -1 ? 'max' : String(bytes));
  switch (type) {
    case 'varchar':
    case 'char':
    case 'varbinary':
    case 'binary':
      return `${type}(${length(maxLength)})`;
    case 'nvarchar':
    case 'nchar':
      return `${type}(${maxLength === -1 ? 'max' : maxLength / 2})`;
    case 'decimal':
    case 'numeric':
      return `${type}(${precision},${scale})`;
    case 'datetime2':
    case 'datetimeoffset':
    case 'time':
      return `${type}(${scale})`;
    default:
      return type;
  }
}

const FILTER_OPERATORS = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'] as const;

const WRITE_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'TRUNCATE', 'DROP', 'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'DENY',
  'EXEC', 'EXECUTE', 'INTO', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVE', 'SET', 'USE', 'DBCC', 'KILL', 'SHUTDOWN',
  'RECONFIGURE', 'BACKUP', 'RESTORE', 'BULK', 'OPENROWSET', 'OPENQUERY', 'OPENDATASOURCE', 'WAITFOR',
];

const HINTS: Record<string, string> = {
  Table: 'Use Get Tables to list the tables.',
  View: 'Use List Views to list the views.',
  Procedure: 'Use List Routines to list the procedures.',
};

const READ_DEFAULT_LIMIT = 100;
const READ_MAX_LIMIT = 1000;
const WRITE_GUARD_DEFAULT = 100;
const WRITE_GUARD_MAX = 10000;

export const mssqlAi = {
  withPool,
  withTransaction,
  qualifiedName,
  resolveObject,
  boundedInteger,
  toBindValue,
  parseValues,
  bind,
  buildWhere,
  buildSet,
  buildOrderBy,
  projection,
  guardedWrite,
  assertReadOnlyQuery,
  isRecord,
  typeLabel,
  TABLE_KINDS: ['U', 'V'],
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
  WRITE_GUARD_DEFAULT,
  WRITE_GUARD_MAX,
};

export const mssqlAiProps = {
  schema: Property.ShortText({
    displayName: 'Schema',
    description: 'Schema name, as returned by Get Tables (table_schema) or List Schemas. Leave empty for the connection user\'s default schema, usually dbo.',
    required: false,
  }),
  table: Property.ShortText({
    displayName: 'Table',
    description: 'Table or view name without the schema, as returned by Get Tables (table_name).',
    required: true,
  }),
  namePattern: Property.ShortText({
    displayName: 'Name Pattern',
    description: 'Optional SQL LIKE pattern on the name, e.g. %order%. Leave empty to list all.',
    required: false,
  }),
  filters: ({ required }: { required: boolean }) =>
    Property.Array({
      displayName: 'Filters',
      description: `Conditions combined with AND. Each has a column, an operator (${FILTER_OPERATORS.join(', ')}) and a value. For IN / NOT IN pass a JSON list such as ["a", "b"] or comma-separated values; IS NULL / IS NOT NULL take no value.${required ? ' At least one filter is required.' : ''}`,
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

type FilterOperator = (typeof FILTER_OPERATORS)[number];

type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

type WriteResult = {
  rows: Record<string, unknown>[];
  rows_affected: number;
};

export type SqlFragment = {
  sql: string;
  params: Record<string, unknown>;
};
