import { randomUUID } from 'crypto';
import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { Client, QueryConfig, QueryResultRow } from 'pg';
import format from 'pg-format';
import { postgresAuth } from './auth';
import { pgClient } from './client';

async function withClient<T>({ auth, fn }: { auth: PostgresAuthValue; fn: (client: Client) => Promise<T> }): Promise<T> {
  const client = await pgClient(auth);
  client.on('error', () => undefined);
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function inTransaction<T>({ client, readOnly, fn }: { client: Client; readOnly: boolean; fn: () => Promise<T> }): Promise<T> {
  await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
  try {
    const result = await fn();
    await client.query(readOnly ? 'ROLLBACK' : 'COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

function singleStatement({ text, values }: { text: string; values: unknown[] }): QueryConfig<unknown[]> {
  return { name: `ap_${randomUUID().replace(/-/g, '')}`, text, values };
}

function splitName({ name }: { name: string }): { schema: string | null; name: string } {
  const dot = name.indexOf('.');
  return dot === -1 ? { schema: null, name } : { schema: name.slice(0, dot), name: name.slice(dot + 1) };
}

function quoteName({ name }: { name: string }): string {
  const parts = splitName({ name });
  return parts.schema === null ? format.ident(parts.name) : format('%I.%I', parts.schema, parts.name);
}

async function resolveRelation({ client, name, label }: { client: Client; name: string; label: string }): Promise<Relation> {
  const result = await client.query<Relation>(
    `SELECT c.oid::text AS oid, n.nspname AS schema, c.relname AS name, c.relkind AS kind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = to_regclass($1)`,
    [quoteName({ name })],
  );
  const relation = result.rows[0];
  if (relation === undefined) {
    throw new Error(`${label} "${name}" was not found. Use schema.name, or a name on the search path; Get Tables and List Views list them.`);
  }
  return relation;
}

async function primaryKeyColumns({ client, oid }: { client: Client; oid: string }): Promise<string[]> {
  const result = await client.query<{ name: string }>(
    `SELECT a.attname AS name FROM pg_index i JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum WHERE i.indrelid = $1::oid AND i.indisprimary ORDER BY k.ord`,
    [oid],
  );
  return result.rows.map((row) => row.name);
}

function buildWhere({ filters, startAt }: { filters: unknown; startAt: number }): SqlFragment {
  const parts = parseFilters({ filters }).reduce<SqlFragment[]>((acc, filter) => {
    const used = acc.reduce((total, part) => total + part.values.length, 0);
    return [...acc, filterToSql({ filter, index: startAt + used })];
  }, []);
  if (parts.length === 0) {
    return { sql: '', values: [] };
  }
  return {
    sql: ` WHERE ${parts.map((part) => part.sql).join(' AND ')}`,
    values: parts.flatMap((part) => part.values),
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
    return `${format.ident(entry['column'])} ${direction}`;
  });
  return parts.length > 0 ? ` ORDER BY ${parts.join(', ')}` : '';
}

function buildSet({ values, startAt }: { values: Record<string, unknown>; startAt: number }): SqlFragment {
  const columns = Object.keys(values);
  return {
    sql: columns.map((column, index) => `${format.ident(column)} = $${startAt + index + 1}`).join(', '),
    values: columns.map((column) => values[column]),
  };
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

function parseValues({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new Error(`${label} must be an object with at least one column name mapped to a value.`);
  }
  return value;
}

async function guardedWrite({ client, quotedTable, where, maxRows, write, verb }: {
  client: Client;
  quotedTable: string;
  where: SqlFragment;
  maxRows: number;
  write: SqlFragment;
  verb: string;
}): Promise<{ rows: QueryResultRow[]; rowCount: number }> {
  if (where.sql === '') {
    throw new Error(`Provide at least one filter; this action never ${verb} a whole table.`);
  }
  const refuse = (total: number): Error =>
    new Error(`The filters match ${total} rows, more than Max Rows (${maxRows}). Nothing was ${verb}; narrow the filters or raise Max Rows.`);
  return inTransaction({
    client,
    readOnly: false,
    fn: async () => {
      const counted = await client.query<{ total: string }>(
        `SELECT count(*) AS total FROM (SELECT 1 FROM ${quotedTable}${where.sql} FOR UPDATE) AS matched`,
        where.values,
      );
      const total = Number(counted.rows[0]?.total ?? 0);
      if (total > maxRows) {
        throw refuse(total);
      }
      const result = await client.query(write.sql, write.values);
      const rowCount = result.rowCount ?? 0;
      if (rowCount > maxRows) {
        throw refuse(rowCount);
      }
      return { rows: result.rows, rowCount };
    },
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

function filterToSql({ filter, index }: { filter: Filter; index: number }): SqlFragment {
  const column = format.ident(filter.column);
  const placeholder = `$${index + 1}`;
  if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
    return { sql: `${column} ${filter.operator}`, values: [] };
  }
  if (filter.value === undefined || filter.value === null || filter.value === '') {
    throw new Error(`Filter on "${filter.column}" with ${filter.operator} needs a value. Use IS NULL to match empty values.`);
  }
  if (filter.operator === 'IN') {
    return { sql: `${column} = ANY(${placeholder})`, values: [toArray({ value: filter.value })] };
  }
  if (filter.operator === 'NOT IN') {
    return { sql: `${column} <> ALL(${placeholder})`, values: [toArray({ value: filter.value })] };
  }
  return { sql: `${column} ${filter.operator} ${placeholder}`, values: [filter.value] };
}

function toArray({ value }: { value: unknown }): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const text = String(value);
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
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }
  return value;
}

function notSystemSchema({ column }: { column: string }): string {
  return `${column} NOT LIKE 'pg\\_%' AND ${column} <> 'information_schema'`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilterOperator(value: string): value is FilterOperator {
  return FILTER_OPERATORS.some((operator) => operator === value);
}

const FILTER_OPERATORS = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'NOT LIKE', 'ILIKE', 'NOT ILIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'] as const;

const READ_DEFAULT_LIMIT = 100;
const READ_MAX_LIMIT = 1000;
const WRITE_GUARD_DEFAULT = 100;
const WRITE_GUARD_MAX = 10000;
const INSERT_MAX_ROWS = 1000;

export const postgresAi = {
  withClient,
  inTransaction,
  singleStatement,
  splitName,
  quoteName,
  resolveRelation,
  primaryKeyColumns,
  buildWhere,
  buildOrderBy,
  buildSet,
  boundedInteger,
  parseValues,
  guardedWrite,
  isRecord,
  notSystemSchema,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
  WRITE_GUARD_DEFAULT,
  WRITE_GUARD_MAX,
  INSERT_MAX_ROWS,
};

export const postgresAiProps = {
  table: Property.ShortText({
    displayName: 'Table',
    description: 'Table name as returned by Get Tables, written schema.table (e.g. public.orders). A bare name is looked up on the search path.',
    required: true,
  }),
  schema: Property.ShortText({
    displayName: 'Schema',
    description: 'Only list objects in this schema, as returned by List Schemas. Leave empty for every non-system schema.',
    required: false,
  }),
  namePattern: Property.ShortText({
    displayName: 'Name Pattern',
    description: 'Optional SQL LIKE pattern on the name, e.g. %order%. Leave empty to list all.',
    required: false,
  }),
  args: Property.Array({
    displayName: 'Arguments',
    description: 'Values for $1, $2 and so on, in order.',
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

type PostgresAuthValue = AppConnectionValueForAuthProperty<typeof postgresAuth>;

type FilterOperator = (typeof FILTER_OPERATORS)[number];

type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

export type SqlFragment = {
  sql: string;
  values: unknown[];
};

export type Relation = {
  oid: string;
  schema: string;
  name: string;
  kind: string;
};
