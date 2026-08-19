import { AppConnectionValueForAuthProperty, isNil } from '@activepieces/pieces-framework';
import sql from 'mssql';
import type { mssqlAuth } from '../auth';

const DEFAULT_PORT = 1433;
const TIMEOUT_MS = 30000;
const OUTPUT_BLOCKED_BY_TRIGGER = 334;

function isOutputBlockedByTrigger(e: unknown): boolean {
  if (typeof e !== 'object' || isNil(e) || !('number' in e)) return false;
  const { number } = e;
  return number === OUTPUT_BLOCKED_BY_TRIGGER;
}

function quoteId(identifier: string): string {
  if (identifier.includes('\0')) {
    throw new Error(`Invalid identifier: ${JSON.stringify(identifier)}`);
  }
  return `[${identifier.replace(/]/g, ']]')}]`;
}

function quoteTable(table: MssqlTable): string {
  return `${quoteId(table.table_schema)}.${quoteId(table.table_name)}`;
}

function buildConfig({
  auth,
  requestTimeoutMs,
}: {
  auth: MssqlAuth;
  requestTimeoutMs?: number;
}): sql.config {
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

  const requestTimeout = isNil(requestTimeoutMs)
    ? TIMEOUT_MS
    : Number(requestTimeoutMs);
  const cryptoCredentialsDetails: Record<string, string> = {};
  if (certificate && certificate.trim().length > 0) {
    cryptoCredentialsDetails['ca'] = certificate.trim();
  }
  if (min_tls_version) {
    cryptoCredentialsDetails['minVersion'] = min_tls_version;
  }

  if (connection_string && connection_string.trim().length > 0) {
    const trimmed = connection_string.trim();
    if (/Password\s*=\s*\{?your_password\}?/i.test(trimmed)) {
      throw new Error(
        'The connection string still contains the {your_password} placeholder from the Azure portal. Replace it with your actual password.'
      );
    }
    const entra = trimmed.match(/Authentication\s*=\s*(Active Directory[^;]*)/i);
    if (entra) {
      throw new Error(
        `This piece supports SQL Server authentication only, but the connection string asks for "${entra[1].trim()}". Copy the ADO.NET (SQL authentication) string from the Azure portal instead, or fill in the Username and Password fields.`
      );
    }
    const parsed = sql.ConnectionPool.parseConnectionString(trimmed);
    parsed.requestTimeout = requestTimeout;
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

async function connect({
  auth,
  requestTimeoutMs,
}: {
  auth: MssqlAuth;
  requestTimeoutMs?: number;
}): Promise<sql.ConnectionPool> {
  const config = buildConfig({ auth, requestTimeoutMs });
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
  } catch (e) {
    await pool.close().catch(() => undefined);
    if (config.options?.instanceName) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(
        `${reason} Connecting by instance name ("${config.options.instanceName}") requires the SQL Server Browser service on UDP port 1434, which many networks block. Address the server by host and port instead, for example myhost,1433.`
      );
    }
    throw e;
  }
  return pool;
}

async function getTables(pool: sql.ConnectionPool): Promise<MssqlTable[]> {
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

async function getTableMeta({
  pool,
  table,
}: {
  pool: sql.ConnectionPool;
  table: MssqlTable;
}): Promise<MssqlTableMeta> {
  const result = await pool
    .request()
    .input('schema', table.table_schema)
    .input('name', table.table_name)
    .query<Record<string, unknown>>(
      `DECLARE @object int = OBJECT_ID(QUOTENAME(@schema) + '.' + QUOTENAME(@name));

       SELECT c.name, TYPE_NAME(c.system_type_id) AS type_name, c.precision,
              c.scale, c.max_length, c.is_nullable, c.collation_name
       FROM sys.columns c
       WHERE c.object_id = @object
       ORDER BY c.column_id;

       SELECT i.index_id, i.is_primary_key, c.name AS column_name, c.is_nullable
       FROM sys.indexes i
       JOIN sys.index_columns ic
         ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        AND ic.is_included_column = 0
       JOIN sys.columns c
         ON c.object_id = i.object_id AND c.column_id = ic.column_id
       WHERE i.object_id = @object
         AND i.is_unique = 1
         AND i.has_filter = 0
         AND i.is_disabled = 0
         AND i.is_hypothetical = 0
       ORDER BY i.index_id, ic.key_ordinal;

       SELECT name
       FROM sys.identity_columns
       WHERE object_id = @object AND increment_value > 0;`
    );

  const recordsets: Record<string, unknown>[][] = Array.isArray(
    result.recordsets
  )
    ? result.recordsets
    : [];
  const [columnRows, indexRows, identityRows] = recordsets;

  const columns: MssqlColumn[] = (columnRows ?? []).map((row) => ({
    name: String(row['name']),
    type: String(row['type_name']).toLowerCase(),
    precision: Number(row['precision']),
    scale: Number(row['scale']),
    maxLength: Number(row['max_length']),
    nullable: Boolean(row['is_nullable']),
    collation: isNil(row['collation_name'])
      ? undefined
      : String(row['collation_name']),
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

function bindParameters({
  request,
  parameters,
}: {
  request: sql.Request;
  parameters: Record<string, unknown> | undefined;
}): sql.Request {
  for (const [name, value] of Object.entries(parameters ?? {})) {
    request.input(name.replace(/^@/, ''), value ?? null);
  }
  return request;
}

async function writeReturningRows({
  bind,
  withOutput,
  withoutOutput,
}: {
  bind: () => sql.Request;
  withOutput: string;
  withoutOutput: string;
}): Promise<{ rows: Record<string, unknown>[]; rows_affected: number }> {
  const total = (counts: number[]) => counts.reduce((a, b) => a + b, 0);
  try {
    const result = await bind().query<Record<string, unknown>>(withOutput);
    return {
      rows: result.recordset ?? [],
      rows_affected: total(result.rowsAffected ?? []),
    };
  } catch (e) {
    if (!isOutputBlockedByTrigger(e)) throw e;
    const result = await bind().query<Record<string, unknown>>(withoutOutput);
    return { rows: [], rows_affected: total(result.rowsAffected ?? []) };
  }
}

export const mssqlCommon = {
  isOutputBlockedByTrigger,
  quoteId,
  quoteTable,
  buildConfig,
  connect,
  getTables,
  getTableMeta,
  bindParameters,
  writeReturningRows,
};

export type MssqlAuth = AppConnectionValueForAuthProperty<typeof mssqlAuth>;

export type MssqlTable = {
  table_schema: string;
  table_name: string;
};

export type MssqlColumn = {
  name: string;
  type: string;
  precision: number;
  scale: number;
  maxLength: number;
  nullable: boolean;
  collation?: string;
};

export type MssqlTableMeta = {
  columns: MssqlColumn[];
  identity?: string;
  keyColumns: string[];
};
