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

export type MssqlColumn = {
  name: string;
  /** base system type name, e.g. 'datetime2' -- never an alias type */
  type: string;
  precision: number;
  scale: number;
  /** in bytes, and -1 for a max type */
  maxLength: number;
  nullable: boolean;
};

export type MssqlTableMeta = {
  columns: MssqlColumn[];
  /**
   * An ascending IDENTITY that is also the sole key of a unique index: a row
   * added later always carries a higher value, so it cannot be stranded behind
   * a cursor, and it is immutable as well as unique. Both conditions matter.
   * IDENTITY(n, -1) is legal and counts downward, and IDENTITY alone is not
   * unique -- a reseed or an IDENTITY_INSERT load can repeat values unless a
   * unique index enforces otherwise.
   */
  identity?: string;
  /**
   * Columns that uniquely identify a row, in key order. Prefers the primary
   * key, then the narrowest non-nullable unique index -- a unique constraint
   * identifies a row just as well as a declared key, and plenty of tables have
   * only one. Empty when the table has neither.
   */
  keyColumns: string[];
};

/**
 * Everything the trigger needs to know about a table's shape, in one round
 * trip. It used to be three separate queries issued on every single poll.
 */
export async function mssqlGetTableMeta(
  pool: sql.ConnectionPool,
  table: MssqlTable
): Promise<MssqlTableMeta> {
  const result = await pool
    .request()
    .input('qualified', `${table.table_schema}.${table.table_name}`)
    .query(
      // TYPE_NAME(system_type_id) rather than a join on user_type_id: an alias
      // type reports its own name, and only base types can be CONVERT targets.
      `SELECT c.name, TYPE_NAME(c.system_type_id) AS type_name, c.precision,
              c.scale, c.max_length, c.is_nullable
       FROM sys.columns c
       WHERE c.object_id = OBJECT_ID(@qualified)
       ORDER BY c.column_id;

       SELECT i.index_id, i.is_primary_key, c.name AS column_name, c.is_nullable
       FROM sys.indexes i
       JOIN sys.index_columns ic
         ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        AND ic.is_included_column = 0
       JOIN sys.columns c
         ON c.object_id = i.object_id AND c.column_id = ic.column_id
       WHERE i.object_id = OBJECT_ID(@qualified)
         AND i.is_unique = 1
         AND i.has_filter = 0
       ORDER BY i.index_id, ic.key_ordinal;

       SELECT name
       FROM sys.identity_columns
       WHERE object_id = OBJECT_ID(@qualified) AND increment_value > 0;`
    );

  const [columnRows, indexRows, identityRows] = result.recordsets as Record<
    string,
    unknown
  >[][];

  const columns: MssqlColumn[] = (columnRows ?? []).map((row) => ({
    name: String(row['name']),
    type: String(row['type_name']).toLowerCase(),
    precision: Number(row['precision']),
    scale: Number(row['scale']),
    maxLength: Number(row['max_length']),
    nullable: Boolean(row['is_nullable']),
  }));

  const indexes = new Map<
    number,
    { isPrimary: boolean; nullable: boolean; columns: string[] }
  >();
  for (const row of indexRows ?? []) {
    const id = Number(row['index_id']);
    const entry = indexes.get(id) ?? {
      isPrimary: Boolean(row['is_primary_key']),
      nullable: false,
      columns: [],
    };
    entry.columns.push(String(row['column_name']));
    if (row['is_nullable']) entry.nullable = true;
    indexes.set(id, entry);
  }

  // Nullable candidates are dropped rather than merely deprioritised: a NULL key
  // value makes every comparison against it UNKNOWN, which would silently drop
  // the row from the cursor window instead of ordering it.
  const candidates = [...indexes.values()]
    .filter((index) => !index.nullable)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.columns.length - b.columns.length;
    });

  const ascending =
    (identityRows ?? []).length === 1
      ? String(identityRows[0]['name'])
      : undefined;
  const identity =
    ascending !== undefined &&
    candidates.some(
      (index) => index.columns.length === 1 && index.columns[0] === ascending
    )
      ? ascending
      : undefined;

  return {
    columns,
    identity,
    keyColumns: candidates[0]?.columns ?? [],
  };
}

// ORDER BY rejects these types, so no cursor can be built on them
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
