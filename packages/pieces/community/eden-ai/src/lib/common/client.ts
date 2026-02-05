import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.edenai.run/v2';
const DEFAULT_TIMEOUT = 20000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF = 1000;

function logEdenAiError(error: any, context: Record<string, any>) {
  const log = {
    error: error?.message || error,
    status: error?.response?.status,
    body: error?.response?.body,
    context,
  };
  if (typeof console !== 'undefined' && console.error) {
    console.error('Eden AI API Error:', JSON.stringify(log));
  }
}

function parseEdenAiError(error: any): string {
  if (error?.response?.body?.error) return error.response.body.error;
  if (error?.response?.body?.message) return error.response.body.message;
  if (error?.message) return error.message;
  return String(error);
}

export async function edenAiApiCall<T = any>({
  apiKey,
  method,
  resourceUri,
  body,
  query,
  headers: customHeaders = {},
  timeout = DEFAULT_TIMEOUT,
  maxRetries = MAX_RETRIES,
}: {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}): Promise<T> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    throw new Error('Missing or invalid Eden AI API key. Please check your credentials.');
  }
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const url = `${BASE_URL}${resourceUri}`;
  let lastError;
  const stringQueryParams = query
    ? Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)]))
    : undefined;
  for (let attempt = 0; attempt < maxRetries; ++attempt) {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url,
        headers,
        body,
        queryParams: stringQueryParams,
        timeout,
      });
      if (response.status < 200 || response.status >= 300) {
        const err = new Error(`Eden AI API error: ${response.status} ${JSON.stringify(response.body)}`);
        (err as any).response = response;
        throw err;
      }

      return response.body;
    } catch (err: any) {
      lastError = err;
      logEdenAiError(err, { url, method, body, query, attempt });

      const status = err?.response?.status;
      if (status === 429 || (status && status >= 500 && status < 600)) {
        if (attempt < maxRetries - 1) {
          const delay = RETRY_BACKOFF * Math.pow(2, attempt);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
      }
      
      break;
    }
  }

  throw new Error(parseEdenAiError(lastError));
} 