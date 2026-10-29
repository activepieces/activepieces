import { HttpMethod } from '@activepieces/pieces-common';

import { databricksClient } from './client';
import { databricksUtils } from './utils';

import type {
  DatabricksAuthValue,
  DatabricksCredentials,
  DatabricksFileColumn,
  DatabricksGenieAnswer,
  DatabricksGenieMessage,
  DatabricksGenieSpace,
  DatabricksNamed,
  DatabricksQueryResult,
  DatabricksResultChunk,
  DatabricksStatement,
  DatabricksStatementParameter,
  DatabricksTable,
  DatabricksToken,
  DatabricksWarehouse,
} from './types';

async function getAccessToken({
  credentials,
}: {
  credentials: DatabricksCredentials;
}): Promise<DatabricksToken> {
  return await databricksClient.fetchToken({ credentials });
}

async function getCurrentUser({
  auth,
}: {
  auth: DatabricksAuthValue;
}): Promise<{ userName?: string; displayName?: string }> {
  return await databricksClient.request<{
    userName?: string;
    displayName?: string;
  }>({
    auth,
    method: HttpMethod.GET,
    path: '/api/2.0/preview/scim/v2/Me',
  });
}

async function listWarehouses({
  auth,
}: {
  auth: DatabricksAuthValue;
}): Promise<DatabricksWarehouse[]> {
  const response = await databricksClient.request<{
    warehouses?: DatabricksWarehouse[];
  }>({
    auth,
    method: HttpMethod.GET,
    path: '/api/2.0/sql/warehouses',
  });
  return response.warehouses ?? [];
}

async function listCatalogs({
  auth,
}: {
  auth: DatabricksAuthValue;
}): Promise<DatabricksNamed[]> {
  return await databricksClient.paginate<'catalogs', DatabricksNamed>({
    auth,
    path: '/api/2.1/unity-catalog/catalogs',
    itemsKey: 'catalogs',
  });
}

async function listSchemas({
  auth,
  catalogName,
}: {
  auth: DatabricksAuthValue;
  catalogName: string;
}): Promise<DatabricksNamed[]> {
  return await databricksClient.paginate<'schemas', DatabricksNamed>({
    auth,
    path: '/api/2.1/unity-catalog/schemas',
    query: { catalog_name: catalogName },
    itemsKey: 'schemas',
  });
}

async function listTables({
  auth,
  catalogName,
  schemaName,
}: {
  auth: DatabricksAuthValue;
  catalogName: string;
  schemaName: string;
}): Promise<DatabricksNamed[]> {
  return await databricksClient.paginate<'tables', DatabricksNamed>({
    auth,
    path: '/api/2.1/unity-catalog/tables',
    query: {
      catalog_name: catalogName,
      schema_name: schemaName,
      omit_columns: 'true',
    },
    itemsKey: 'tables',
  });
}

async function listVolumes({
  auth,
  catalogName,
  schemaName,
}: {
  auth: DatabricksAuthValue;
  catalogName: string;
  schemaName: string;
}): Promise<DatabricksNamed[]> {
  return await databricksClient.paginate<'volumes', DatabricksNamed>({
    auth,
    path: '/api/2.1/unity-catalog/volumes',
    query: { catalog_name: catalogName, schema_name: schemaName },
    itemsKey: 'volumes',
  });
}

async function getTable({
  auth,
  catalogName,
  schemaName,
  tableName,
}: {
  auth: DatabricksAuthValue;
  catalogName: string;
  schemaName: string;
  tableName: string;
}): Promise<DatabricksTable> {
  const fullName = [catalogName, schemaName, tableName].join('.');
  return await databricksClient.request<DatabricksTable>({
    auth,
    method: HttpMethod.GET,
    path: `/api/2.1/unity-catalog/tables/${encodeURIComponent(fullName)}`,
  });
}

async function executeStatement({
  auth,
  warehouseId,
  statement,
  parameters,
}: {
  auth: DatabricksAuthValue;
  warehouseId: string;
  statement: string;
  parameters?: DatabricksStatementParameter[];
}): Promise<DatabricksQueryResult> {
  const finished = await runStatement({
    auth,
    warehouseId,
    statement,
    parameters,
  });
  const chunks = await fetchRemainingChunks({
    auth,
    statementId: finished.statement_id,
    first: finished.result,
  });
  return toQueryResult({ statement: finished, dataArray: chunks });
}

async function executeWriteStatement({
  auth,
  warehouseId,
  statement,
  parameters,
}: {
  auth: DatabricksAuthValue;
  warehouseId: string;
  statement: string;
  parameters?: DatabricksStatementParameter[];
}): Promise<Record<string, unknown>> {
  const result = await executeStatement({
    auth,
    warehouseId,
    statement,
    parameters,
  });
  return { ...result.rows[0], statementId: result.statementId };
}

async function getFileColumns({
  auth,
  warehouseId,
  path,
  format,
  options,
}: {
  auth: DatabricksAuthValue;
  warehouseId: string;
  path: string;
  format: string;
  options: Record<string, string>;
}): Promise<DatabricksFileColumn[]> {
  const optionList = Object.entries({ format, ...options })
    .map(
      ([key, value]) =>
        `${key} => ${databricksUtils.stringLiteral({ value })}`
    )
    .join(', ');
  const finished = await runStatement({
    auth,
    warehouseId,
    statement: `SELECT * FROM read_files(${databricksUtils.stringLiteral({
      value: path,
    })}, ${optionList}) LIMIT 0`,
  });
  return (finished.manifest?.schema?.columns ?? []).filter(
    (column) => column.name !== RESCUED_DATA_COLUMN
  );
}

async function uploadFile({
  auth,
  path,
  data,
}: {
  auth: DatabricksAuthValue;
  path: string;
  data: Buffer;
}): Promise<void> {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  await databricksClient.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/api/2.0/fs/files${encodedPath}`,
    query: { overwrite: 'false' },
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data,
  });
}

async function listGenieSpaces({
  auth,
}: {
  auth: DatabricksAuthValue;
}): Promise<DatabricksGenieSpace[]> {
  return await databricksClient.paginate<'spaces', DatabricksGenieSpace>({
    auth,
    path: '/api/2.0/genie/spaces',
    itemsKey: 'spaces',
  });
}

async function askGenie({
  auth,
  spaceId,
  question,
  conversationId,
}: {
  auth: DatabricksAuthValue;
  spaceId: string;
  question: string;
  conversationId?: string;
}): Promise<DatabricksGenieAnswer> {
  const posted = await databricksClient.request<DatabricksGenieMessage>({
    auth,
    method: HttpMethod.POST,
    path: conversationId
      ? `/api/2.0/genie/spaces/${spaceId}/conversations/${conversationId}/messages`
      : `/api/2.0/genie/spaces/${spaceId}/start-conversation`,
    body: { content: question },
  });
  const ids = {
    conversationId: posted.conversation_id,
    messageId: posted.message_id ?? posted.id ?? '',
  };
  const message = await waitForGenieMessage({ auth, spaceId, ...ids });
  const answer =
    message.attachments
      ?.map((a) => a.text?.content)
      .filter((text) => !!text)
      .join('\n\n') ?? '';
  const queryAttachment = message.attachments?.find((a) => a.query);
  const result = queryAttachment?.attachment_id
    ? await getGenieQueryResult({
        auth,
        spaceId,
        ...ids,
        attachmentId: queryAttachment.attachment_id,
      })
    : undefined;
  return {
    conversationId: ids.conversationId,
    messageId: ids.messageId,
    status: message.status,
    answer,
    sql: queryAttachment?.query?.query ?? null,
    queryDescription: queryAttachment?.query?.description ?? null,
    columns: result?.columns ?? [],
    rows: result?.rows ?? [],
    rowCount: result?.rowCount ?? 0,
    truncated: result?.truncated ?? false,
  };
}

async function runStatement({
  auth,
  warehouseId,
  statement,
  parameters,
}: {
  auth: DatabricksAuthValue;
  warehouseId: string;
  statement: string;
  parameters?: DatabricksStatementParameter[];
}): Promise<DatabricksStatement> {
  const submitted = await databricksClient.request<DatabricksStatement>({
    auth,
    method: HttpMethod.POST,
    path: '/api/2.0/sql/statements',
    body: {
      warehouse_id: warehouseId,
      statement,
      parameters,
      wait_timeout: '50s',
      on_wait_timeout: 'CONTINUE',
      disposition: 'INLINE',
      format: 'JSON_ARRAY',
    },
  });
  return await waitForStatement({ auth, statement: submitted });
}

async function waitForStatement({
  auth,
  statement,
}: {
  auth: DatabricksAuthValue;
  statement: DatabricksStatement;
}): Promise<DatabricksStatement> {
  const deadline = Date.now() + MAX_WAIT_MS;
  let current = statement;
  while (PENDING_STATEMENT_STATES.includes(current.status.state)) {
    if (Date.now() > deadline) {
      await databricksClient.request<unknown>({
        auth,
        method: HttpMethod.POST,
        path: `/api/2.0/sql/statements/${current.statement_id}/cancel`,
      });
      throw new Error(
        'The SQL statement did not finish within 8 minutes and was canceled.'
      );
    }
    await sleep({ ms: POLL_INTERVAL_MS });
    current = await databricksClient.request<DatabricksStatement>({
      auth,
      method: HttpMethod.GET,
      path: `/api/2.0/sql/statements/${current.statement_id}`,
    });
  }
  if (current.status.state !== 'SUCCEEDED') {
    throw new Error(
      `SQL statement ${current.status.state.toLowerCase()}: ${
        current.status.error?.message ?? 'no error message returned'
      }`
    );
  }
  return current;
}

async function fetchRemainingChunks({
  auth,
  statementId,
  first,
}: {
  auth: DatabricksAuthValue;
  statementId: string;
  first?: DatabricksResultChunk;
}): Promise<(string | null)[][]> {
  const chunks = [first?.data_array ?? []];
  let nextChunk = first?.next_chunk_index;
  while (nextChunk !== undefined) {
    const chunk = await databricksClient.request<DatabricksResultChunk>({
      auth,
      method: HttpMethod.GET,
      path: `/api/2.0/sql/statements/${statementId}/result/chunks/${nextChunk}`,
    });
    chunks.push(chunk.data_array ?? []);
    nextChunk = chunk.next_chunk_index;
  }
  return chunks.flat();
}

async function waitForGenieMessage({
  auth,
  spaceId,
  conversationId,
  messageId,
}: GenieMessageIds & {
  auth: DatabricksAuthValue;
}): Promise<DatabricksGenieMessage> {
  const deadline = Date.now() + MAX_WAIT_MS;
  for (;;) {
    const message = await databricksClient.request<DatabricksGenieMessage>({
      auth,
      method: HttpMethod.GET,
      path: `/api/2.0/genie/spaces/${spaceId}/conversations/${conversationId}/messages/${messageId}`,
    });
    if (message.status === 'COMPLETED') {
      return message;
    }
    if (FAILED_GENIE_STATES.includes(message.status)) {
      throw new Error(
        `Genie could not answer (${message.status}): ${
          message.error?.error ?? 'no error message returned'
        }`
      );
    }
    if (Date.now() > deadline) {
      throw new Error('Genie did not answer within 8 minutes.');
    }
    await sleep({ ms: POLL_INTERVAL_MS });
  }
}

async function getGenieQueryResult({
  auth,
  spaceId,
  conversationId,
  messageId,
  attachmentId,
}: GenieMessageIds & {
  auth: DatabricksAuthValue;
  attachmentId: string;
}): Promise<DatabricksQueryResult> {
  const response = await databricksClient.request<{
    statement_response: DatabricksStatement;
  }>({
    auth,
    method: HttpMethod.GET,
    path: `/api/2.0/genie/spaces/${spaceId}/conversations/${conversationId}/messages/${messageId}/attachments/${attachmentId}/query-result`,
  });
  const dataArray = await fetchRemainingChunks({
    auth,
    statementId: response.statement_response.statement_id,
    first: response.statement_response.result,
  });
  return toQueryResult({ statement: response.statement_response, dataArray });
}

function toQueryResult({
  statement,
  dataArray,
}: {
  statement: DatabricksStatement;
  dataArray: (string | null)[][];
}): DatabricksQueryResult {
  const columns = statement.manifest?.schema?.columns ?? [];
  const rows = dataArray.map((values) =>
    Object.fromEntries(
      columns.map((column, index) => [
        column.name,
        parseValue({ value: values[index], typeName: column.type_name }),
      ])
    )
  );
  return {
    statementId: statement.statement_id,
    columns: columns.map((column) => column.name),
    rows,
    rowCount: rows.length,
    truncated: statement.manifest?.truncated ?? false,
  };
}

function parseValue({
  value,
  typeName,
}: {
  value: string | null | undefined;
  typeName?: string;
}): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeName === 'BOOLEAN') {
    return value === 'true';
  }
  if (typeName && NUMERIC_TYPES.includes(typeName)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ||
      (typeName !== 'LONG' && Number.isFinite(parsed))
      ? parsed
      : value;
  }
  return value;
}

function sleep({ ms }: { ms: number }): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const databricksApi = {
  getAccessToken,
  getCurrentUser,
  listWarehouses,
  listCatalogs,
  listSchemas,
  listTables,
  listVolumes,
  getTable,
  executeStatement,
  executeWriteStatement,
  getFileColumns,
  uploadFile,
  listGenieSpaces,
  askGenie,
};

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 8 * 60 * 1000;
const PENDING_STATEMENT_STATES = ['PENDING', 'RUNNING'];
const FAILED_GENIE_STATES = ['FAILED', 'CANCELLED', 'QUERY_RESULT_EXPIRED'];
const RESCUED_DATA_COLUMN = '_rescued_data';
const NUMERIC_TYPES = ['BYTE', 'SHORT', 'INT', 'LONG', 'FLOAT', 'DOUBLE'];

type GenieMessageIds = {
  spaceId: string;
  conversationId: string;
  messageId: string;
};
