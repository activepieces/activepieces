import type {
  Bind,
  Connection,
  ConnectionOptions,
  RowStatement,
  FileAndStageBindStatement,
  SnowflakeError,
} from 'snowflake-sdk';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { loadSnowflakeSdk } from './sdk';
import { normalizePrivateKey } from './private-key';

export function buildConnectionOptions({
  auth,
  application = DEFAULT_APPLICATION_NAME,
}: {
  auth: SnowflakeAuthValue;
  application?: string;
}): ConnectionOptions {
  if (auth.type === AppConnectionType.OAUTH2) {
    return {
      account: auth.props.account.trim(),
      authenticator: 'OAUTH',
      token: auth.access_token,
      database: emptyToUndefined(auth.props.database),
      warehouse: emptyToUndefined(auth.props.warehouse),
      role: emptyToUndefined(auth.props.role),
      application,
    };
  }
  return buildCustomAuthOptions({ props: auth.props, application });
}

export function buildCustomAuthOptions({
  props,
  application = DEFAULT_APPLICATION_NAME,
}: {
  props: CustomAuthProps;
  application?: string;
}): ConnectionOptions {
  const options: ConnectionOptions = {
    account: props.account.trim(),
    username: props.username.trim(),
    database: emptyToUndefined(props.database),
    warehouse: emptyToUndefined(props.warehouse),
    role: emptyToUndefined(props.role),
    application,
  };
  if (props.privateKey && props.privateKey.trim() !== '') {
    options.authenticator = 'SNOWFLAKE_JWT';
    options.privateKey = normalizePrivateKey(props.privateKey);
    if (props.privateKeyPassphrase) {
      options.privateKeyPass = props.privateKeyPassphrase;
    }
  } else {
    options.password = props.password;
  }
  return options;
}

export async function withSnowflake<T>({
  auth,
  application,
  statementTimeoutSeconds = MAX_STATEMENT_TIMEOUT_SECONDS,
  fn,
}: {
  auth: SnowflakeAuthValue;
  application?: string;
  statementTimeoutSeconds?: number;
  fn: (session: SnowflakeSession) => Promise<T>;
}): Promise<T> {
  return withConnectionOptions({
    options: buildConnectionOptions({ auth, application }),
    statementTimeoutSeconds,
    fn,
  });
}

export async function withConnectionOptions<T>({
  options,
  statementTimeoutSeconds = MAX_STATEMENT_TIMEOUT_SECONDS,
  fn,
}: {
  options: ConnectionOptions;
  statementTimeoutSeconds?: number;
  fn: (session: SnowflakeSession) => Promise<T>;
}): Promise<T> {
  const sdk = await loadSnowflakeSdk();
  const connection = sdk.createConnection(options);
  try {
    await connectAsync(connection);
  } catch (error) {
    throw friendlyConnectionError(error);
  }
  try {
    const session = createSession(connection);
    const timeout = clampTimeout(statementTimeoutSeconds);
    await session.query({
      sql: `ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = ${timeout}`,
    });
    return await fn(session);
  } finally {
    await destroyAsync(connection).catch(() => undefined);
  }
}

export function clampTimeout(seconds: number | undefined | null): number {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return MAX_STATEMENT_TIMEOUT_SECONDS;
  }
  return Math.min(Math.ceil(value), MAX_STATEMENT_TIMEOUT_SECONDS);
}

export function friendlyConnectionError(error: unknown): Error {
  const code = errorCode(error);
  const original = error instanceof Error ? error.message : String(error);
  const hint = code ? CONNECTION_ERROR_HINTS[code] : undefined;
  if (hint) {
    return new Error(`${hint} (Snowflake: ${original})`);
  }
  return error instanceof Error ? error : new Error(original);
}

function createSession(connection: Connection): SnowflakeSession {
  return {
    query: ({ sql, binds, maxRows }) =>
      runStatement({ connection, sql, binds, maxRows }),
    getQueryStatus: (queryId) => connection.getQueryStatus(queryId),
  };
}

function runStatement({
  connection,
  sql,
  binds,
  maxRows,
}: {
  connection: Connection;
  sql: string;
  binds?: Bind[];
  maxRows?: number;
}): Promise<QueryResult> {
  return new Promise<QueryResult>((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds: binds && binds.length > 0 ? binds : undefined,
      streamResult: true,
      complete: (
        error: SnowflakeError | undefined,
        statement: RowStatement | FileAndStageBindStatement
      ) => {
        if (error) {
          reject(error);
          return;
        }
        const total = statement.getNumRows() ?? 0;
        const queryId = readQueryId(statement);
        const columns = (statement.getColumns() ?? []).map((column) =>
          column.getName()
        );
        const limit =
          maxRows === undefined ? total : Math.min(total, Math.max(0, maxRows));
        if (limit === 0) {
          resolve({
            rows: [],
            columns,
            totalRows: total,
            truncated: total > 0,
            queryId,
          });
          return;
        }
        const rows: Record<string, unknown>[] = [];
        statement
          .streamRows({ start: 0, end: limit - 1 })
          .on('error', reject)
          .on('data', (row: Record<string, unknown>) => {
            rows.push(row);
          })
          .on('end', () =>
            resolve({
              rows,
              columns,
              totalRows: total,
              truncated: total > rows.length,
              queryId,
            })
          );
      },
    });
  });
}

function readQueryId(
  statement: RowStatement | FileAndStageBindStatement
): string | null {
  try {
    return statement.getQueryId() ?? null;
  } catch {
    return null;
  }
}

function connectAsync(connection: Connection): Promise<void> {
  return new Promise((resolve, reject) =>
    connection.connect((error) => (error ? reject(error) : resolve()))
  );
}

function destroyAsync(connection: Connection): Promise<void> {
  return new Promise((resolve, reject) =>
    connection.destroy((error) => (error ? reject(error) : resolve()))
  );
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string' || typeof code === 'number') {
      return String(code);
    }
  }
  return undefined;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const DEFAULT_APPLICATION_NAME = 'ActivePieces';
export const MAX_STATEMENT_TIMEOUT_SECONDS = 540;

const ACCOUNT_IDENTIFIER_HINT =
  'Could not reach the Snowflake account. The Account Identifier looks wrong: use the orgname-accountname form (Snowflake console > your profile > Account > View account details), or a legacy locator with its region such as xy12345.us-east-2.aws.';

const CONNECTION_ERROR_HINTS: Record<string, string> = {
  '390100':
    'Snowflake rejected the username or password. Check the credentials in your connection.',
  '390144':
    'Snowflake rejected the key-pair login. Check that the private key matches the public key registered on the user (ALTER USER ... SET RSA_PUBLIC_KEY) and that the passphrase is correct.',
  '390318':
    'The Snowflake OAuth access token has expired. Reconnect the OAuth connection.',
  '390303':
    'The Snowflake OAuth access token is invalid. Reconnect the OAuth connection.',
  '390422':
    'Snowflake blocked this login because of a network policy on the account or user. Allow Activepieces IP addresses in the network policy.',
  '250001':
    'Could not connect to Snowflake. Check the Account Identifier (for example orgname-accountname) in your connection.',
  '401001': ACCOUNT_IDENTIFIER_HINT,
  '401002': ACCOUNT_IDENTIFIER_HINT,
  '390189':
    'The role in your connection is not granted to this user. Leave Default Role empty or pick a granted role.',
  '390201':
    'The default database or warehouse in your connection does not exist or is not authorized for this role.',
};

export type CustomAuthProps = {
  account: string;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPassphrase?: string;
  database?: string;
  role?: string;
  warehouse?: string;
};

export type SnowflakeAuthValue =
  | {
      type: AppConnectionType.OAUTH2;
      access_token: string;
      props: {
        account: string;
        database?: string;
        warehouse?: string;
        role?: string;
      };
    }
  | {
      type: AppConnectionType.CUSTOM_AUTH;
      props: CustomAuthProps;
    };

export type QueryResult = {
  rows: Record<string, unknown>[];
  columns: string[];
  totalRows: number;
  truncated: boolean;
  queryId: string | null;
};

export type SnowflakeSession = {
  query: (params: {
    sql: string;
    binds?: Bind[];
    maxRows?: number;
  }) => Promise<QueryResult>;
  getQueryStatus: (queryId: string) => Promise<string>;
};
