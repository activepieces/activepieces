import { HttpMethod } from '@activepieces/pieces-common';

export const FLIPSIDE_BASE_URL = 'https://api-v2.flipsidecrypto.xyz';

export interface FlipsideJsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown[];
  id: number;
}

export interface FlipsideJsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface QueryRunResult {
  queryRun: {
    id: string;
    sqlStatementId: string;
    state: string;
    path: string;
    fileCount: number;
    lastFileNumber: number;
    fileNames: string[];
    errorName: string | null;
    errorMessage: string | null;
    errorData: unknown | null;
    dataSourceQueryId: string | null;
    dataSourceSessionId: string | null;
    startedAt: string;
    queryRunningEndedAt: string | null;
    queryStreamingEndedAt: string | null;
    endedAt: string | null;
    rowCount: number | null;
    totalSize: number | null;
    tags: Record<string, string>;
    dataSourceConnectionId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
}

export interface QueryRunResultsResult {
  rows: unknown[][];
  columnNames: string[];
  columnTypes: string[];
  status: string;
  page: {
    currentPageNumber: number;
    currentPageSize: number;
    totalRows: number;
    totalPages: number;
  };
  originalQueryRun: QueryRunResult['queryRun'];
  redirectedToQueryRun: QueryRunResult['queryRun'] | null;
}

export async function callFlipsideApi<T>(
  apiKey: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const body: FlipsideJsonRpcRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: 1,
  };

  const response = await fetch(`${FLIPSIDE_BASE_URL}/json-rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-sdk-package-name': '@activepieces/piece-flipside-crypto',
      'x-sdk-package-version': '0.1.0',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Flipside API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as FlipsideJsonRpcResponse<T>;

  if (json.error) {
    throw new Error(`Flipside RPC error [${json.error.code}]: ${json.error.message}`);
  }

  return json.result as T;
}
