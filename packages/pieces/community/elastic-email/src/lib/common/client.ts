import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

import { ELASTIC_EMAIL_API_BASE } from './constants';

export async function elasticEmailRequest<T = unknown>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${ELASTIC_EMAIL_API_BASE}${path}`,
    headers: {
      'X-ElasticEmail-ApiKey': apiKey,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    queryParams,
    body,
  });
  return response.body;
}
