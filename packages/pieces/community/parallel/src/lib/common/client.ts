import {
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

async function callApi<TResponse extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<TResponse> {
  const request: HttpRequest = {
    method,
    url: `${PARALLEL_BASE_URL}${path}`,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  };
  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

export const parallelClient = {
  request: callApi,
};

export const PARALLEL_BASE_URL = 'https://api.parallel.ai';

export const TASK_PROCESSORS = [
  { label: 'Lite', value: 'lite' },
  { label: 'Base', value: 'base' },
  { label: 'Core', value: 'core' },
  { label: 'Pro', value: 'pro' },
  { label: 'Ultra', value: 'ultra' },
];

export const FINDALL_GENERATORS = [
  { label: 'Base', value: 'base' },
  { label: 'Core', value: 'core' },
  { label: 'Pro', value: 'pro' },
  { label: 'Preview', value: 'preview' },
];
