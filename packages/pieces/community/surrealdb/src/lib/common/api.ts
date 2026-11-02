import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { surrealdbClient } from './client';
import { surrealdbUtils } from './utils';
import type { SurrealdbAuthValue, SurrealdbRpcResponse, SurrealdbStatementResult } from './types';

async function query<T>({ auth, sql, args }: { auth: SurrealdbAuthValue; sql: string; args?: QueryParams }): Promise<SurrealdbStatementResult<T>[]> {
  return await surrealdbClient.request<SurrealdbStatementResult<T>[]>({
    auth,
    method: HttpMethod.POST,
    path: '/sql',
    headers: { 'Content-Type': 'text/plain' },
    query: args,
    body: sql,
  });
}

async function rpc<T>({ auth, method, params }: { auth: SurrealdbAuthValue; method: string; params: unknown[] }): Promise<T> {
  const response = await surrealdbClient.request<SurrealdbRpcResponse<T>>({
    auth,
    method: HttpMethod.POST,
    path: '/rpc',
    headers: { 'Content-Type': 'application/json' },
    body: { id: 1, method, params },
  });
  if (response.error) {
    throw new Error(`SurrealDB error: ${response.error.message ?? 'unknown error'}`);
  }
  if (response.result === undefined) {
    throw new Error('SurrealDB returned no result.');
  }
  return response.result;
}

async function rpcQuery<T>({ auth, sql, vars }: { auth: SurrealdbAuthValue; sql: string; vars: Record<string, unknown> }): Promise<T> {
  const statements = await rpc<SurrealdbStatementResult<T>[]>({ auth, method: 'query', params: [sql, vars] });
  return surrealdbUtils.lastStatementResult({ statements });
}

export const surrealdbApi = { query, rpc, rpcQuery };
