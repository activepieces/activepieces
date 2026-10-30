import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import type { PerplexityAiAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.perplexity.ai';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: PerplexityAiAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    headers: { 'Content-Type': 'application/json' },
    queryParams: query,
    body,
  });
  return response.body;
}

export const perplexityAiClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};
