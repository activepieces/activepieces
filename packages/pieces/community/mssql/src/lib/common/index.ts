import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import sql from 'mssql';
// type-only: importing the value would close an auth -> common -> auth cycle
import type { mssqlAuth } from '../auth';

export type MssqlAuth = AppConnectionValueForAuthProperty<typeof mssqlAuth>;

const DEFAULT_PORT = 1433;
const TIMEOUT_MS = 30000;

export type MssqlTable = {
  table_schema: string;
  table_name: string;
};

// 334 fires at compile time, so nothing was written and a retry is safe
export function isOutputBlockedByTrigger(e: unknown): boolean {
  return (e as { number?: number }).number === 334;
}

// hand-rolled because no maintained T-SQL identifier escaper exists on npm
export function quoteId(identifier: string): string {
  if (identifier.includes('\0')) {
    throw new Error(`Invalid identifier: ${JSON.stringify(identifier)}`);
  }
  return `[${identifier.replace(/]/g, ']]')}]`;
}

export function quoteTable(table: MssqlTable): string {
  return `${quoteId(table.table_schema)}.${quoteId(table.table_name)}`;
}

export function buildConfig(auth: MssqlAuth, requestTimeoutMs?: number): sql.config {
  const {
    connection_string,
    host,
    port,
    database,
    user,
    password,
    encrypt,
    trust_server_certificate,
    certificate,
    min_tls_version,
  } = auth.props;

  const requestTimeout = requestTimeoutMs ? Number(requestTimeoutMs) : TIMEOUT_MS;
  const cryptoCredentialsDetails: Record<string, string> = {};
  if (certificate && certificate.trim().length > 0) {
    cryptoCredentialsDetails['ca'] = certificate.trim();
  }
  if (min_tls_version) {
    cryptoCredentialsDetails['minVersion'] = min_tls_version;
  }

  if (connection_string && connection_string.trim().length > 0) {
    const trimmed = connection_string.trim();
    // left in place this parses fine and fails later as a bare "Login failed"
    if (/Password\s*=\s*\{?your_password\}?/i.test(trimmed)) {
      throw new Error(
        'The connection string still contains the {your_password} placeholder from the Azure portal. Replace it with your actual password.'
      );
    }
    // the parser drops Authentication= and falls back to SQL auth silently
    const entra = trimmed.match(/Authentication\s*=\s*(Active Directory[^;]*)/i);
    if (entra) {
      throw new Error(
        `This piece supports SQL Server authentication only, but the connection string asks for "${entra[1].trim()}". Copy the ADO.NET (SQL authentication) string from the Azure portal instead, or fill in the Username and Password fields.`
      );
    }
    const parsed = sql.ConnectionPool.parseConnectionString(trimmed);
    if (requestTimeoutMs) {
      parsed.requestTimeout = requestTimeout;
    }
    // a connection string cannot express a CA bundle or a TLS floor
    if (Object.keys(cryptoCredentialsDetails).length > 0) {
      parsed.options = {
        ...parsed.options,
        cryptoCredentialsDetails: {
          ...(parsed.options?.cryptoCredentialsDetails ?? {}),
          ...cryptoCredentialsDetails,
        },
      };
    }
    return parsed;
  }

  if (!host || !user || !password) {
    throw new Error(
      'Host, Username and Password are required unless a Connection String is provided.'
    );
  }

  return {
    server: host,
    port: port ? Number(port) : DEFAULT_PORT,
    database: database || undefined,
    user,
    password,
    connectionTimeout: TIMEOUT_MS,
    requestTimeout,
    options: {
      encrypt: encrypt ?? true,
      trustServerCertificate: trust_server_certificate ?? false,
      cryptoCredentialsDetails,
    },
  };
}

// one pool per execution, closed by the caller — a shared singleton would leak across flows
export async function mssqlConnect(
  auth: MssqlAuth,
  requestTimeoutMs?: number
): Promise<sql.ConnectionPool> {
  const config = buildConfig(auth, requestTimeoutMs);
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
  } catch (e) {
    await pool.close().catch(() => undefined);
    // instance lookup is a UDP 1434 call that just times out where blocked
    if (config.options?.instanceName) {
      throw new Error(
        `${
          (e as Error).message
        } Connecting by instance name ("${config.options.instanceName}") requires the SQL Server Browser service on UDP port 1434, which many networks block. Address the server by host and port instead, for example myhost,1433.`
      );
    }
    throw e;
  }
  return pool;
}

export async function mssqlGetTables(
  pool: sql.ConnectionPool
): Promise<MssqlTable[]> {
  const result = await pool.request().query(
    `SELECT TABLE_SCHEMA, TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_SCHEMA, TABLE_NAME`
  );
  return result.recordset.map((row) => ({
    table_schema: row['TABLE_SCHEMA'],
    table_name: row['TABLE_NAME'],
  }));
}

// every primary key column, in key order -- composite keys included
export async function mssqlGetKeyColumns(
  pool: sql.ConnectionPool,
  table: MssqlTable
): Promise<string[]> {
  const result = await pool
    .request()
    .input('table_schema', table.table_schema)
    .input('table_name', table.table_name)
    .query(
      `SELECT c.COLUMN_NAME
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS t
       JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c
         ON c.CONSTRAINT_NAME = t.CONSTRAINT_NAME
        AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
       WHERE t.CONSTRAINT_TYPE = 'PRIMARY KEY'
         AND t.TABLE_SCHEMA = @table_schema
         AND t.TABLE_NAME = @table_name
       ORDER BY c.ORDINAL_POSITION`
    );
  return (result.recordset ?? []).map((row) => row['COLUMN_NAME']);
}

// ORDER BY rejects these types, so they cannot be part of a tiebreaker
const UNSORTABLE = ['text', 'ntext', 'image', 'xml', 'geography', 'geometry'];

export async function mssqlGetSortableColumns(
  pool: sql.ConnectionPool,
  table: MssqlTable
): Promise<string[]> {
  const result = await pool
    .request()
    .input('table_schema', table.table_schema)
    .input('table_name', table.table_name)
    .query(
      `SELECT COLUMN_NAME, DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @table_schema AND TABLE_NAME = @table_name
       ORDER BY ORDINAL_POSITION`
    );
  return (result.recordset ?? [])
    .filter((row) => !UNSORTABLE.includes(String(row['DATA_TYPE']).toLowerCase()))
    .map((row) => row['COLUMN_NAME']);
}

export async function mssqlGetColumns(
  pool: sql.ConnectionPool,
  table: MssqlTable
): Promise<string[]> {
  const result = await pool
    .request()
    .input('table_schema', table.table_schema)
    .input('table_name', table.table_name)
    .query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @table_schema AND TABLE_NAME = @table_name
       ORDER BY ORDINAL_POSITION`
    );
  return result.recordset.map((row) => row['COLUMN_NAME']);
}
