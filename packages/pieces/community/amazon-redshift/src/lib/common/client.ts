import { AppConnectionType, AuthValidationServerContext, ServerContext, tryCatch } from '@activepieces/pieces-framework';
import {
  CancelStatementCommand,
  DescribeStatementCommand,
  DescribeStatementResponse,
  ExecuteStatementCommand,
  Field,
  GetStatementResultCommand,
  RedshiftDataClient,
  SqlParameter,
} from '@aws-sdk/client-redshift-data';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { Client, CustomTypesConfig, QueryConfig, types } from 'pg';
import type { RedshiftAuthValue, RedshiftIamProps, RedshiftPasswordProps, RedshiftQueryResult, RedshiftRow } from './types';

async function runSql({ auth, server, sql, params = [] }: RunSqlParams & { auth: RedshiftAuthValue; server: AnyServerContext }): Promise<RedshiftQueryResult> {
  if (hasMultipleStatements({ sql })) {
    throw new Error('Run one SQL statement per step. Split the statements over several steps.');
  }
  if (auth.type === AppConnectionType.OIDC) {
    return await runWithDataApi({ props: auth.props, server, sql, params });
  }
  return await runWithPg({ props: auth.props, sql, params });
}

async function runWithPg({ props, sql, params }: SqlStatement & { props: RedshiftPasswordProps }): Promise<RedshiftQueryResult> {
  const client = new Client({
    host: props.host,
    port: Number(props.port),
    user: props.user,
    password: props.password,
    database: props.database,
    ssl: props.enable_ssl ? { rejectUnauthorized: true } : undefined,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    types: redshiftTypeParsers(),
  });
  client.on('error', () => undefined);
  await client.connect();
  try {
    const query: QueryConfig & { queryMode: 'extended' } = { text: sql, values: params, queryMode: 'extended' };
    const result = await client.query<RedshiftRow>(query);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  } finally {
    await client.end();
  }
}

function redshiftTypeParsers(): CustomTypesConfig {
  return {
    getTypeParser: (oid: number, format?: 'text' | 'binary') => {
      if (RAW_TEXT_TYPE_OIDS.includes(oid)) {
        return (value: string) => value;
      }
      if (oid === BIGINT_TYPE_OID) {
        return parseBigint;
      }
      return types.getTypeParser(oid, format);
    },
  };
}

function parseBigint(value: string): number | string {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
}

async function runWithDataApi({ props, server, sql, params }: SqlStatement & { props: RedshiftIamProps; server: AnyServerContext }): Promise<RedshiftQueryResult> {
  const credentials = await getTemporaryCredentials({ props, server });
  const client = new RedshiftDataClient({ region: props.region, credentials });
  client.middlewareStack.add(
    (next) => async (args) => {
      const result = await next(args);
      await keepLargeIntegersAsText({ response: result.response });
      return result;
    },
    { step: 'deserialize', priority: 'low', name: 'keepLargeIntegersAsText' },
  );
  const { text, parameters } = toNamedParameters({ sql, params });
  const started = await client.send(
    new ExecuteStatementCommand({
      Sql: text,
      Database: props.database,
      WorkgroupName: nonEmpty(props.workgroupName),
      ClusterIdentifier: nonEmpty(props.clusterIdentifier),
      DbUser: nonEmpty(props.dbUser),
      SecretArn: nonEmpty(props.secretArn),
      Parameters: parameters.length > 0 ? parameters : undefined,
    }),
  );
  if (!started.Id) {
    throw new Error('Redshift did not return a statement id.');
  }
  const statement = await waitForStatement({ client, id: started.Id, deadline: Date.now() + QUERY_TIMEOUT_MS });
  if (!statement.HasResultSet) {
    return { rows: [], rowCount: Math.max(statement.ResultRows ?? 0, 0) };
  }
  const rows = await readRows({ client, id: started.Id });
  return { rows, rowCount: rows.length };
}

async function keepLargeIntegersAsText({ response }: { response: unknown }): Promise<void> {
  if (typeof response !== 'object' || response === null || !('body' in response) || !isByteStream(response.body)) {
    return;
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.body) {
    chunks.push(chunk);
  }
  response.body = Buffer.from(
    Buffer.concat(chunks)
      .toString('utf8')
      .replace(LONG_VALUE_FIELD, (match: string, digits: string) => (Number.isSafeInteger(Number(digits)) ? match : `"stringValue":"${digits}"`)),
  );
}

function isByteStream(body: unknown): body is AsyncIterable<Uint8Array> {
  return typeof body === 'object' && body !== null && Symbol.asyncIterator in body;
}

async function waitForStatement({ client, id, deadline }: { client: RedshiftDataClient; id: string; deadline: number }): Promise<DescribeStatementResponse> {
  const statement = await client.send(new DescribeStatementCommand({ Id: id }));
  if (statement.Status === 'FINISHED') {
    return statement;
  }
  if (statement.Status === 'FAILED' || statement.Status === 'ABORTED') {
    throw new Error(statement.Error ?? `The query was ${statement.Status.toLowerCase()}.`);
  }
  if (Date.now() > deadline) {
    const { error } = await tryCatch(() => client.send(new CancelStatementCommand({ Id: id })));
    throw new Error(
      error
        ? `The query did not finish within ${QUERY_TIMEOUT_MS / 1000} seconds and could not be cancelled, so it may still complete in Redshift (statement id ${id}).`
        : `The query did not finish within ${QUERY_TIMEOUT_MS / 1000} seconds and was cancelled.`,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, STATEMENT_POLL_INTERVAL_MS));
  return await waitForStatement({ client, id, deadline });
}

async function readRows({ client, id }: { client: RedshiftDataClient; id: string }): Promise<RedshiftRow[]> {
  const rows: RedshiftRow[] = [];
  let nextToken: string | undefined;
  do {
    const page = await client.send(new GetStatementResultCommand({ Id: id, NextToken: nextToken }));
    const names = (page.ColumnMetadata ?? []).map((column, index) => column.label ?? column.name ?? `column_${index + 1}`);
    rows.push(...(page.Records ?? []).map((record) => Object.fromEntries(record.map((field, index) => [names[index], fieldValue({ field })]))));
    nextToken = page.NextToken;
  } while (nextToken);
  return rows;
}

function fieldValue({ field }: { field: Field }): unknown {
  if (field.isNull) {
    return null;
  }
  return field.stringValue ?? field.longValue ?? field.doubleValue ?? field.booleanValue ?? field.blobValue ?? null;
}

function toNamedParameters({ sql, params }: { sql: string; params: unknown[] }): { text: string; parameters: SqlParameter[] } {
  const used = new Set<number>();
  const text = sql.replace(SQL_TOKENS, (match: string) => {
    const placeholder = ARG_PLACEHOLDER.exec(match);
    if (!placeholder) {
      return match;
    }
    const index = Number(placeholder[1]) - 1;
    if (index < 0 || index >= params.length) {
      throw new Error(`The query uses ${match} but only ${params.length} argument(s) were given.`);
    }
    const value = params[index];
    if (value === null || value === undefined) {
      return 'NULL';
    }
    used.add(index);
    return `:p${index + 1}`;
  });
  const parameters = [...used].map((index) => ({ name: `p${index + 1}`, value: toText({ value: params[index] }) }));
  return { text, parameters };
}

function hasMultipleStatements({ sql }: { sql: string }): boolean {
  return sql.replace(SKIPPED_SQL, ' ').replace(/[\s;]+$/, '').includes(';');
}

function toText({ value }: { value: unknown }): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function getTemporaryCredentials({ props, server }: { props: RedshiftIamProps; server: AnyServerContext }): Promise<TemporaryCredentials> {
  const cacheKey = 'token' in server ? `${server.token}:${props.roleArn}:${props.region}` : undefined;
  const cached = cacheKey ? credentialsCache.get(cacheKey) : undefined;
  if (cached && cached.expiresAtMS - Date.now() > CREDENTIALS_EXPIRY_MARGIN_MS) {
    return cached.credentials;
  }
  const token = await resolveOidcToken({ server });
  const sts = new STSClient({
    region: props.region,
    maxAttempts: 2,
    requestHandler: { requestTimeout: STS_REQUEST_TIMEOUT_MS, connectionTimeout: STS_CONNECT_TIMEOUT_MS },
  });
  const { Credentials } = await sts.send(
    new AssumeRoleWithWebIdentityCommand({
      RoleArn: props.roleArn.trim(),
      RoleSessionName: 'activepieces-execution',
      WebIdentityToken: token,
      DurationSeconds: STS_DURATION_SECONDS,
    }),
  );
  if (!Credentials?.AccessKeyId || !Credentials.SecretAccessKey) {
    throw new Error('Failed to assume role: no credentials returned.');
  }
  const credentials = {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
  if (cacheKey) {
    sweepExpiredCredentials();
    credentialsCache.set(cacheKey, { credentials, expiresAtMS: Credentials.Expiration?.getTime() ?? Date.now() + STS_DURATION_SECONDS * 1000 });
  }
  return credentials;
}

async function resolveOidcToken({ server }: { server: AnyServerContext }): Promise<string> {
  if ('mintOidcToken' in server) {
    return await server.mintOidcToken({ audience: AWS_STS_AUDIENCE });
  }
  const baseUrl = server.apiUrl.endsWith('/') ? server.apiUrl : `${server.apiUrl}/`;
  const response = await fetch(`${baseUrl}v1/worker/oidc-token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${server.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audience: AWS_STS_AUDIENCE }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get an OIDC token: ${response.statusText}`);
  }
  const body: { token?: string } = await response.json();
  if (!body.token) {
    throw new Error('Failed to get an OIDC token: empty response.');
  }
  return body.token;
}

function sweepExpiredCredentials(): void {
  const now = Date.now();
  credentialsCache.forEach((value, key) => {
    if (value.expiresAtMS <= now) {
      credentialsCache.delete(key);
    }
  });
}

export const redshiftClient = { runSql };

const RAW_TEXT_TYPE_OIDS = [1082, 1083, 1114, 1184, 1266];
const BIGINT_TYPE_OID = 20;
const LONG_VALUE_FIELD = /"longValue":(-?\d+)/g;
const SKIPPED_SQL_TEXT = String.raw`'(?:[^'\\]|''|\\[\s\S])*'|"(?:[^"]|"")*"|\$(?<tag>[A-Za-z_][A-Za-z_0-9]*|)\$[\s\S]*?\$\k<tag>\$|--[^\n]*|\/\*[\s\S]*?\*\/`;
const SKIPPED_SQL = new RegExp(SKIPPED_SQL_TEXT, 'g');
const SQL_TOKENS = new RegExp(`${SKIPPED_SQL_TEXT}|\\$\\d+`, 'g');
const ARG_PLACEHOLDER = /^\$(\d+)$/;
const CONNECT_TIMEOUT_MS = 30_000;
const QUERY_TIMEOUT_MS = 300_000;
const STATEMENT_POLL_INTERVAL_MS = 1_000;
const AWS_STS_AUDIENCE = 'sts.amazonaws.com';
const STS_DURATION_SECONDS = 3600;
const STS_REQUEST_TIMEOUT_MS = 10_000;
const STS_CONNECT_TIMEOUT_MS = 5_000;
const CREDENTIALS_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const credentialsCache = new Map<string, CachedCredentials>();

type AnyServerContext = ServerContext | AuthValidationServerContext;

type RunSqlParams = { sql: string; params?: unknown[] };

type SqlStatement = { sql: string; params: unknown[] };

type TemporaryCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | undefined;
};

type CachedCredentials = {
  credentials: TemporaryCredentials;
  expiresAtMS: number;
};
