import { SnowflakeAuthValue, withSnowflake } from './client';
import { identifier, qualifiedName } from './sql';

const CURSOR = '__AP_CURSOR';
const PAGE_SIZE = 1000;
const GROUP_LIMIT = 10000;

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
}: {
  auth: SnowflakeAuthValue;
  table: string;
  column: string;
  after: string | null;
}): Promise<{ rows: Record<string, unknown>[]; cursor: string | null }> {
  const col = identifier({ name: column, label: 'Timestamp column' });
  const cursorExpr = `DATE_PART(EPOCH_MICROSECOND, ${col})`;
  const from = `SELECT t.*, ${cursorExpr} AS "${CURSOR}" FROM ${qualifiedName({
    value: table,
    label: 'Table',
  })} t`;
  const where = after === null ? `${col} IS NOT NULL` : `${cursorExpr} > ?`;
  const page = await withSnowflake({
    auth,
    fn: (session) =>
      session.query({
        sql: `${from} WHERE ${where} ORDER BY ${cursorExpr} ASC LIMIT ${PAGE_SIZE}`,
        binds: after === null ? [] : [after],
        maxRows: PAGE_SIZE,
      }),
  });
  let rows = page.rows;
  if (rows.length === PAGE_SIZE) {
    const lastCursor = cursorString(rows[rows.length - 1][CURSOR]);
    const trimmed = rows.filter(
      (row) => cursorString(row[CURSOR]) !== lastCursor
    );
    if (trimmed.length > 0) {
      rows = trimmed;
    } else if (lastCursor !== null) {
      const group = await withSnowflake({
        auth,
        fn: (session) =>
          session.query({
            sql: `${from} WHERE ${cursorExpr} = ? LIMIT ${GROUP_LIMIT}`,
            binds: [lastCursor],
            maxRows: GROUP_LIMIT,
          }),
      });
      rows = group.rows;
    }
  }
  if (rows.length === 0) {
    return { rows: [], cursor: after };
  }
  const cursor = cursorString(rows[rows.length - 1][CURSOR]);
  return { rows: rows.map(stripCursor), cursor: cursor ?? after };
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
