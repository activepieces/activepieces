import type { Bind } from 'snowflake-sdk';
import { QueryResult, SnowflakeSession } from './client';
import {
  identifier,
  qualifiedName,
  quoteIdentifier,
  sqlString,
  toBind,
  valuePlaceholder,
} from './sql';

export function dmlCount({
  result,
  key,
}: {
  result: QueryResult;
  key: string;
}): number {
  const row = result.rows[0];
  if (!row) return 0;
  const value = row[key];
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function buildInsert({
  table,
  rows,
  exactColumnNames = false,
}: {
  table: string;
  rows: Record<string, unknown>[];
  exactColumnNames?: boolean;
}): { sql: string; binds: Bind[] } {
  if (rows.length === 0) {
    throw new Error('Provide at least one row to insert.');
  }
  const columns = Object.keys(rows[0]);
  if (columns.length === 0) {
    throw new Error('Each row needs at least one column.');
  }
  const columnSet = new Set(columns);
  rows.forEach((row, index) => {
    const keys = Object.keys(row);
    const missing = columns.filter((column) => !(column in row));
    const extra = keys.filter((key) => !columnSet.has(key));
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Row ${index + 1} has a different set of columns than the first row.` +
          (missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : '') +
          (extra.length > 0 ? ` Extra: ${extra.join(', ')}.` : '')
      );
    }
  });
  const target = qualifiedName({ value: table, label: 'Table' });
  const columnList = columns
    .map((column) =>
      exactColumnNames
        ? quoteIdentifier(column)
        : identifier({ name: column, label: 'Column' })
    )
    .join(', ');
  const binds: Bind[] = [];
  const hasJson = rows.some((row) =>
    columns.some((column) => valuePlaceholder(row[column]) !== '?')
  );
  if (!hasJson) {
    const tuples = rows
      .map(() => `(${columns.map(() => '?').join(', ')})`)
      .join(', ');
    rows.forEach((row) =>
      columns.forEach((column) => binds.push(toBind(row[column])))
    );
    return {
      sql: `INSERT INTO ${target} (${columnList}) VALUES ${tuples}`,
      binds,
    };
  }
  const selects = rows.map((row) => {
    const expressions = columns.map((column) => {
      binds.push(toBind(row[column]));
      return valuePlaceholder(row[column]);
    });
    return `SELECT ${expressions.join(', ')}`;
  });
  return {
    sql: `INSERT INTO ${target} (${columnList}) ${selects.join(' UNION ALL ')}`,
    binds,
  };
}

export function buildSetClause(values: Record<string, unknown>): {
  clause: string;
  binds: Bind[];
} {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    throw new Error('Provide at least one column value to set.');
  }
  const binds: Bind[] = [];
  const parts = entries.map(([column, value]) => {
    binds.push(toBind(value));
    return `${identifier({
      name: column,
      label: 'Column',
    })} = ${valuePlaceholder(value)}`;
  });
  return { clause: parts.join(', '), binds };
}

export async function guardedWrite({
  session,
  sql,
  binds,
  countKey,
  maxRows,
  tooManyMessage,
}: {
  session: SnowflakeSession;
  sql: string;
  binds: Bind[];
  countKey: string;
  maxRows: number;
  tooManyMessage: (count: number) => string;
}): Promise<number> {
  await session.query({ sql: 'BEGIN' });
  let committed = false;
  try {
    const result = await session.query({ sql, binds });
    const count = dmlCount({ result, key: countKey });
    if (count > maxRows) {
      throw new Error(tooManyMessage(count));
    }
    await session.query({ sql: 'COMMIT' });
    committed = true;
    return count;
  } finally {
    if (!committed) {
      await session.query({ sql: 'ROLLBACK' }).catch(() => undefined);
    }
  }
}

export function scopeClause({
  database,
  schema,
}: {
  database?: string | null;
  schema?: string | null;
}): string {
  if (schema && schema.trim() !== '') {
    const parts =
      schema.includes('.') || !database ? schema : `${database}.${schema}`;
    return ` IN SCHEMA ${qualifiedName({
      value: parts,
      maxParts: 2,
      label: 'Schema',
    })}`;
  }
  if (database && database.trim() !== '') {
    return ` IN DATABASE ${qualifiedName({
      value: database,
      maxParts: 1,
      label: 'Database',
    })}`;
  }
  return '';
}

export function likeClause(pattern: string | null | undefined): string {
  if (!pattern || pattern.trim() === '') return '';
  return ` LIKE ${sqlString(pattern.trim())}`;
}

export async function listShow<T>({
  session,
  sql,
  limit,
  map,
  include,
}: {
  session: SnowflakeSession;
  sql: string;
  limit: number;
  map: (row: Record<string, unknown>) => T;
  include?: (row: Record<string, unknown>) => boolean;
}): Promise<{ items: T[]; count: number; truncated: boolean }> {
  if (!include) {
    const result = await session.query({ sql, maxRows: limit });
    const items = result.rows.map(map);
    return { items, count: items.length, truncated: result.truncated };
  }
  const result = await session.query({ sql, maxRows: LIST_SCAN_MAX_ROWS });
  const kept = result.rows.filter(include);
  const items = kept.slice(0, limit).map(map);
  return {
    items,
    count: items.length,
    truncated: kept.length > limit || result.truncated,
  };
}

const LIST_SCAN_MAX_ROWS = 5000;

export function isUserDefined(row: Record<string, unknown>): boolean {
  return String(row['is_builtin'] ?? 'N').toUpperCase() !== 'Y';
}

export function pick({
  row,
  keys,
}: {
  row: Record<string, unknown>;
  keys: string[];
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = row[key] ?? null;
  }
  return out;
}

export function normaliseTimestamp(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (
    value &&
    typeof value === 'object' &&
    'toJSON' in value &&
    typeof value.toJSON === 'function'
  ) {
    return value.toJSON();
  }
  return value ?? null;
}
