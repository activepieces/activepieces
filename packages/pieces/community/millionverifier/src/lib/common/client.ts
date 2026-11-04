import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { MillionVerifierAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.millionverifier.com/api/v3';
}

async function request<T>({ auth, method, path, query }: RequestParams & { auth: MillionVerifierAuthValue }): Promise<T> {
  const params = new URLSearchParams({ api: auth.secret_text, ...query });
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}?${params.toString()}`,
  });
  return response.body;
}

async function requestOrThrow<T>({ auth, method, path, query }: RequestParams & { auth: MillionVerifierAuthValue }): Promise<T> {
  const body = await request<T>({ auth, method, path, query });
  throwIfFailed({ body });
  return body;
}

async function bulkRequest<T>({ auth, method, path, query, body }: BulkRequestParams & { auth: MillionVerifierAuthValue }): Promise<T> {
  const params = new URLSearchParams({ key: auth.secret_text, ...query });
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BULK_BASE_URL}${path}?${params.toString()}`,
    body,
  });
  throwIfFailed({ body: response.body });
  return response.body;
}

function throwIfFailed({ body }: { body: unknown }): void {
  if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string' && body.error !== '') {
    throw new Error(`MillionVerifier error: ${body.error}`);
  }
}

export const millionVerifierClient = { baseUrl, request, requestOrThrow, bulkRequest };

const BULK_BASE_URL = 'https://bulkapi.millionverifier.com/bulkapi';

type RequestParams = { method: HttpMethod; path: string; query?: Record<string, string> };
type BulkRequestParams = RequestParams & { body?: FormData };
