import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import type { BeamerAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.getbeamer.com/v0';
}

async function request<T>({ auth, method, path, query, body }: RequestParams & { auth: BeamerAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    headers: {
      'Beamer-Api-Key': `${auth.secret_text}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    queryParams: definedQuery({ query }),
    body,
  });
  return response.body;
}

function definedQuery({ query }: { query?: Record<string, string | undefined> }): QueryParams | undefined {
  if (query === undefined) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) => (value === undefined ? [] : [[key, value]])),
  );
}

export const beamerClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};
