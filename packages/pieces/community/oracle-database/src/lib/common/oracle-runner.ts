import oracledb from 'oracledb';
import { ensureOracleClient } from './thick-mode';
import type {
  AffectedResult,
  DropdownEntry,
  ExecuteResult,
  RunnerAuth,
  RunnerRequest,
  RunnerResponse,
} from './runner-protocol';

async function openConnection(auth: RunnerAuth): Promise<oracledb.Connection> {
  const connectString =
    auth.connectionType === 'serviceName'
      ? `${auth.host}:${auth.port}/${auth.serviceName}`
      : auth.connectionString;
  return oracledb.getConnection({
    user: auth.user,
    password: auth.password,
    connectString,
  });
}

async function withConnection<T>(
  auth: RunnerAuth,
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  const conn = await openConnection(auth);
  try {
    return await fn(conn);
  } finally {
    try {
      await conn.close();
    } catch {
      // ignore close failures — primary result already captured
    }
  }
}

function friendlyOracleError(err: unknown): string {
  const e = err as { errorNum?: number; message?: string };
  const message = e?.message ?? 'Unknown Oracle error';
  const num = e?.errorNum;
  if (num === 1) return `Unique constraint violated: ${message}`;
  if (num === 2290 || num === 2291 || num === 2292)
    return `Constraint violation: ${message}`;
  if (num === 1400) return `Required column missing: ${message}`;
  if (num === 904 || num === 942)
    return `Invalid column or table: ${message}`;
  if (num === 1722) return `Invalid number format: ${message}`;
  if (num === 12899) return `Value too large for column: ${message}`;
  return message;
}

async function handle(
  req: RunnerRequest,
  logs: string[]
): Promise<unknown> {
  switch (req.cmd) {
    case 'init': {
      await ensureOracleClient({ thickMode: req.thickMode, logs });
      return { ready: true };
    }
    case 'validate': {
      await withConnection(req.auth, async () => undefined);
      return { valid: true };
    }
    case 'getTables': {
      return await withConnection(req.auth, async (conn) => {
        const result = await conn.execute<{ TABLE_NAME: string }>(
          `SELECT table_name FROM user_tables ORDER BY table_name`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const rows: DropdownEntry[] = (result.rows ?? []).map((row) => ({
          label: row.TABLE_NAME,
          value: row.TABLE_NAME,
        }));
        return rows;
      });
    }
    case 'getColumns': {
      return await withConnection(req.auth, async (conn) => {
        const result = await conn.execute<{ COLUMN_NAME: string }>(
          `SELECT column_name FROM user_tab_columns WHERE table_name = :tableName ORDER BY column_id`,
          { tableName: req.tableName },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const rows: DropdownEntry[] = (result.rows ?? []).map((row) => ({
          label: row.COLUMN_NAME,
          value: row.COLUMN_NAME,
        }));
        return rows;
      });
    }
    case 'insertRow': {
      return await withConnection(req.auth, async (conn) => {
        const columns = Object.keys(req.row);
        const values = Object.values(req.row);
        const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
        const quotedColumns = columns.map((c) => `"${c}"`).join(', ');
        const sql = `INSERT INTO "${req.tableName}" (${quotedColumns}) VALUES (${placeholders})`;
        const result = await conn.execute(sql, values, { autoCommit: true });
        const out: AffectedResult = {
          success: true,
          rowsAffected: result.rowsAffected ?? 0,
        };
        return out;
      });
    }
    case 'insertRows': {
      if (req.rows.length === 0) {
        throw new Error('Rows must be a non-empty array');
      }
      return await withConnection(req.auth, async (conn) => {
        const columns = Object.keys(req.rows[0]);
        const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
        const quotedColumns = columns.map((c) => `"${c}"`).join(', ');
        const sql = `INSERT INTO "${req.tableName}" (${quotedColumns}) VALUES (${placeholders})`;
        const bindData = req.rows.map((row) => columns.map((col) => row[col]));
        const result = await conn.executeMany(sql, bindData, {
          autoCommit: true,
        });
        const out: AffectedResult = {
          success: true,
          rowsAffected: result.rowsAffected ?? 0,
        };
        return out;
      });
    }
    case 'updateRow': {
      return await withConnection(req.auth, async (conn) => {
        const valueKeys = Object.keys(req.values);
        const filterKeys = Object.keys(req.filter);
        const setClause = valueKeys
          .map((k) => `"${k}" = :set_${k}`)
          .join(', ');
        const whereClause = filterKeys
          .map((k) => `"${k}" = :whr_${k}`)
          .join(' AND ');
        const binds: Record<string, unknown> = {};
        for (const k of valueKeys) binds[`set_${k}`] = req.values[k];
        for (const k of filterKeys) binds[`whr_${k}`] = req.filter[k];
        let sql = `UPDATE "${req.tableName}" SET ${setClause}`;
        if (whereClause) sql += ` WHERE ${whereClause}`;
        const result = await conn.execute(sql, binds as oracledb.BindParameters, { autoCommit: true });
        const out: AffectedResult = {
          success: true,
          rowsAffected: result.rowsAffected ?? 0,
        };
        return out;
      });
    }
    case 'deleteRow': {
      return await withConnection(req.auth, async (conn) => {
        const filterKeys = Object.keys(req.filter);
        const whereClause = filterKeys
          .map((k) => `"${k}" = :whr_${k}`)
          .join(' AND ');
        const binds: Record<string, unknown> = {};
        for (const k of filterKeys) binds[`whr_${k}`] = req.filter[k];
        const sql = `DELETE FROM "${req.tableName}" WHERE ${whereClause}`;
        const result = await conn.execute(sql, binds as oracledb.BindParameters, { autoCommit: true });
        const out: AffectedResult = {
          success: true,
          rowsAffected: result.rowsAffected ?? 0,
        };
        return out;
      });
    }
    case 'findRow': {
      return await withConnection(req.auth, async (conn) => {
        const filterKeys = Object.keys(req.filter);
        const whereClause = filterKeys
          .map((k) => `"${k}" = :whr_${k}`)
          .join(' AND ');
        const binds: Record<string, unknown> = {};
        for (const k of filterKeys) binds[`whr_${k}`] = req.filter[k];
        const sql = `SELECT * FROM "${req.tableName}" WHERE ${whereClause}`;
        const result = await conn.execute(sql, binds as oracledb.BindParameters, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        return (result.rows as unknown[]) ?? [];
      });
    }
    case 'execute': {
      return await withConnection(req.auth, async (conn) => {
        const result = await conn.execute(req.sql, req.binds as oracledb.BindParameters, {
          autoCommit: true,
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        const out: ExecuteResult = {
          rows: (result.rows as unknown[]) ?? [],
          rowsAffected: result.rowsAffected,
        };
        return out;
      });
    }
  }
}

function send(msg: RunnerResponse): void {
  if (process.send) process.send(msg);
}

function processMessage(raw: RunnerRequest): Promise<void> {
  const logs: string[] = [];
  return handle(raw, logs).then(
    (result) => {
      send({
        id: raw.id,
        ok: true,
        result,
        logs: logs.length > 0 ? logs : undefined,
      });
    },
    (err: unknown) => {
      send({
        id: raw.id,
        ok: false,
        error: { message: friendlyOracleError(err) },
        logs: logs.length > 0 ? logs : undefined,
      });
    }
  );
}

let initGate: Promise<void> | null = null;

process.on('message', (raw: RunnerRequest) => {
  if (raw.cmd === 'init') {
    initGate = processMessage(raw);
    return;
  }
  const wait = initGate ?? Promise.resolve();
  wait.then(() => processMessage(raw));
});

process.on('disconnect', () => {
  process.exit(0);
});
