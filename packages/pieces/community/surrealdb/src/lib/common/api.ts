import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { surrealdbClient } from './client';
import type { SurrealdbAuthValue, SurrealdbStatementResult } from './types';

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

export const surrealdbApi = { query };
