import { SnowflakeAuthValue, withSnowflake } from './client';
import { identifier, qualifiedName } from './sql';

const CURSOR = '__AP_CURSOR';
const HASH = '__AP_ROW_HASH';
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
  hash,
}: {
  auth: SnowflakeAuthValue;
  table: string;
  column: string;
  after: string | null;
  hash?: string;
}): Promise<{
  rows: Record<string, unknown>[];
  cursor: string | null;
  hash?: string;
}> {
  const col = identifier({ name: column, label: 'Timestamp column' });
  const cursorExpr = `DATE_PART(EPOCH_MICROSECOND, ${col})`;
  const rowHash = 'HASH(t.*)';
  let where = `${col} IS NOT NULL`;
  let binds: string[] = [];
  if (after !== null && hash === undefined) {
    where = `${cursorExpr} > ?`;
    binds = [after];
  } else if (after !== null && hash !== undefined) {
    where = `(${cursorExpr} > ? OR (${cursorExpr} = ? AND ${rowHash} > TO_NUMBER(?)))`;
    binds = [after, after, hash];
  }
  const sql = `SELECT t.*, ${cursorExpr} AS "${CURSOR}", TO_VARCHAR(${rowHash}) AS "${HASH}" FROM ${qualifiedName(
    {
      value: table,
      label: 'Table',
    }
  )} t WHERE ${where} ORDER BY ${cursorExpr} ASC, ${rowHash} ASC LIMIT ${PAGE_SIZE}`;
  const result = await withSnowflake({
    auth,
    fn: (session) => session.query({ sql, binds, maxRows: PAGE_SIZE }),
  });
  const rows = result.rows;
  if (rows.length === 0) {
    return { rows: [], cursor: after, hash };
  }
  const lastRow = rows[rows.length - 1];
  const last = cursorString(lastRow[CURSOR]);
  return {
    rows: rows.map(stripCursor),
    cursor: last ?? after,
    hash: cursorString(lastRow[HASH]) ?? undefined,
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
  delete copy[HASH];
  return copy;
}

function cursorString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export const ROW_CURSOR_STORE_KEY = 'snowflake_row_cursor';
