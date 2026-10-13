import { SnowflakeAuthValue, withSnowflake } from './client';
import { identifier, qualifiedName } from './sql';

const CURSOR = '__AP_CURSOR';
const PAGE_SIZE = 1000;

export async function fetchBaseline({
  auth,
  table,
  column,
}: {
  auth: SnowflakeAuthValue;
  table: string;
  column: string;
}): Promise<string | null> {
  const col = identifier({ name: column, label: 'Timestamp column' });
  const sql = `SELECT MAX(DATE_PART(EPOCH_MICROSECOND, ${col})) AS "${CURSOR}" FROM ${qualifiedName(
    { value: table, label: 'Table' }
  )}`;
  const result = await withSnowflake({
    auth,
    fn: (session) => session.query({ sql, maxRows: 1 }),
  });
  return cursorString(result.rows[0]?.[CURSOR]);
}

export async function fetchNewRows({
  auth,
  table,
  column,
  after,
  offset,
}: {
  auth: SnowflakeAuthValue;
  table: string;
  column: string;
  after: string | null;
  offset?: number;
}): Promise<{
  rows: Record<string, unknown>[];
  cursor: string | null;
  offset?: number;
}> {
  const col = identifier({ name: column, label: 'Timestamp column' });
  const cursorExpr = `DATE_PART(EPOCH_MICROSECOND, ${col})`;
  const strict = after !== null && offset === undefined;
  const skip = strict ? 0 : Math.max(0, Math.floor(offset ?? 0));
  const where =
    after === null
      ? `${col} IS NOT NULL`
      : `${cursorExpr} ${strict ? '>' : '>='} ?`;
  const sql = `SELECT t.*, ${cursorExpr} AS "${CURSOR}" FROM ${qualifiedName({
    value: table,
    label: 'Table',
  })} t WHERE ${where} ORDER BY ${cursorExpr} ASC, HASH(t.*) ASC LIMIT ${PAGE_SIZE}${
    skip > 0 ? ` OFFSET ${skip}` : ''
  }`;
  const result = await withSnowflake({
    auth,
    fn: (session) =>
      session.query({
        sql,
        binds: after === null ? [] : [after],
        maxRows: PAGE_SIZE,
      }),
  });
  const rows = result.rows;
  if (rows.length === 0) {
    return { rows: [], cursor: after, offset };
  }
  const last = cursorString(rows[rows.length - 1][CURSOR]);
  let atLast = 0;
  for (const row of rows) {
    if (cursorString(row[CURSOR]) === last) atLast++;
  }
  const sameGroup = !strict && after !== null && last === after;
  return {
    rows: rows.map(stripCursor),
    cursor: last ?? after,
    offset: sameGroup ? skip + atLast : atLast,
  };
}

export async function fetchLatestRows({
  auth,
  table,
  column,
  limit,
}: {
  auth: SnowflakeAuthValue;
  table: string;
  column: string;
  limit: number;
}): Promise<Record<string, unknown>[]> {
  const col = identifier({ name: column, label: 'Timestamp column' });
  const sql = `SELECT * FROM ${qualifiedName({
    value: table,
    label: 'Table',
  })} WHERE ${col} IS NOT NULL ORDER BY ${col} DESC LIMIT ${limit}`;
  const result = await withSnowflake({
    auth,
    fn: (session) => session.query({ sql, maxRows: limit }),
  });
  return result.rows;
}

function stripCursor(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  delete copy[CURSOR];
  return copy;
}

function cursorString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export const ROW_CURSOR_STORE_KEY = 'snowflake_row_cursor';
