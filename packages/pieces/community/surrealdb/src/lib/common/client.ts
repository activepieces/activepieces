import { HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { SurrealdbAuthValue } from './types';

function baseUrl({ auth }: { auth: SurrealdbAuthValue }): string {
  return auth.props.url;
}

async function request<T>({ auth, method, path, query, body, headers }: RequestParams & { auth: SurrealdbAuthValue }): Promise<T> {
  const { username, password, namespace, database } = auth.props;
  const response = await httpClient.sendRequest<T>({
    method,
    url: new URL(path, baseUrl({ auth })).toString(),
    headers: {
      ...headers,
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      'surreal-ns': namespace,
      'surreal-db': database,
    },
    queryParams: query,
    body,
  });
  return response.body;
}

export const surrealdbClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
};
