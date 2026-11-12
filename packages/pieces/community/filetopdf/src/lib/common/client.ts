import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
} from '@activepieces/pieces-common';
import type { FiletopdfApiError, FiletopdfAuthValue } from './types';

function baseUrl(): string {
  return BASE_URL;
}

async function request<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  headers,
}: RequestParams & { auth: FiletopdfAuthValue }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl()}${path}`,
      headers: {
        'x-api-key': auth.secret_text,
        Accept: 'application/json',
        ...headers,
      },
      body,
    });
    return response.body;
  } catch (e) {
    if (e instanceof HttpError) {
      throwFriendly({ status: e.response.status, body: e.response.body });
    }
    throw new Error(e instanceof Error ? e.message : 'FileToPDF request failed.');
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function readErrorEnvelope(body: unknown): FiletopdfApiError {
  const raw = typeof body === 'string' ? safeJsonParse(body) : body;
  if (typeof raw !== 'object' || raw === null || !('error' in raw)) {
    return {};
  }
  const error = raw.error;
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  return {
    code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
    message: 'message' in error && typeof error.message === 'string' ? error.message : undefined,
    upgrade_url:
      'upgrade_url' in error && typeof error.upgrade_url === 'string' ? error.upgrade_url : undefined,
    parameter:
      'parameter' in error && typeof error.parameter === 'string' ? error.parameter : undefined,
    remaining:
      'remaining' in error && typeof error.remaining === 'number' ? error.remaining : undefined,
    concurrent_limit:
      'concurrent_limit' in error && typeof error.concurrent_limit === 'number'
        ? error.concurrent_limit
        : undefined,
  };
}

function friendlyMessage({
  code,
  error,
  status,
}: {
  code: string;
  error: FiletopdfApiError;
  status: number;
}): string {
  switch (code) {
    case 'upgrade_required': {
      const param = error.parameter
        ? `The "${error.parameter}" option`
        : 'That conversion option';
      return `${param} is only available on the Pro and Scale plans (and the free trial). Upgrade to use conversion options${
        error.upgrade_url ? `: ${error.upgrade_url}` : ''
      }.`;
    }
    case 'forbidden_url':
      return 'That URL points to a private or internal address, which is not allowed. Use a public http(s) link.';
    case 'payment_required':
      return `You're out of credits. Top up or upgrade${
        error.upgrade_url ? ` at ${error.upgrade_url}` : ' at https://filetopdf.dev/subscription'
      }.`;
    case 'subscription_required':
      return 'No active subscription. Activate a plan at https://filetopdf.dev/subscription to run conversions.';
    case 'concurrency_limit':
      return `Your plan allows ${
        error.concurrent_limit || 'a limited number of'
      } concurrent conversion(s). Upgrade for more, or retry in a moment.`;
    case 'file_too_large':
      return 'File too large — the maximum is 30 MB.';
    case 'missing_api_key':
    case 'forbidden':
      return 'Invalid or missing API key. Reconnect your FileToPDF account.';
    default:
      return error.message || `Request failed with status ${status}.`;
  }
}

function throwFriendly({ status, body }: { status: number; body: unknown }): never {
  const error = readErrorEnvelope(body);
  const code = error.code || 'error';
  const message = friendlyMessage({ code, error, status });
  const prefix = CONFIG_ERROR_CODES.has(code) ? 'FileToPDF connection problem: ' : '';
  throw new Error(`${prefix}${message} (${code})`);
}

export const filetopdfClient = { baseUrl, request };

const BASE_URL = 'https://api.filetopdf.dev';

const CONFIG_ERROR_CODES = new Set([
  'missing_api_key',
  'forbidden',
  'subscription_required',
  'payment_required',
  'upgrade_required',
]);

type RequestParams = {
  method: HttpMethod;
  path: string;
  body?: HttpMessageBody;
  headers?: HttpHeaders;
};
