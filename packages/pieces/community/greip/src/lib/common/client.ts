import { HttpError, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { GreipAuthValue, GreipErrorBody } from './types';

function baseUrl(): string {
  return 'https://greipapi.com';
}

async function request<T>({ auth, method, path, query, body }: RequestParams & { auth: GreipAuthValue }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl()}${path}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      queryParams: query,
      body,
    });

    const errorBody = toErrorBody({ body: response.body });
    if (errorBody?.status === 'error') {
      throw new Error(errorBody.description || `Greip API error (code: ${errorBody.code || 'unknown'})`);
    }

    return response.body;
  } catch (error) {
    throw new Error(describeError({ error }));
  }
}

function describeError({ error }: { error: unknown }): string {
  const httpError = error instanceof HttpError ? error : undefined;
  let errorBody = toErrorBody({ body: httpError?.response.body });

  if (errorBody?.response?.body) {
    errorBody = errorBody.response.body;
  }

  if (errorBody?.status === 'error') {
    const description = errorBody.description || getErrorMessageByCode({ code: errorBody.code });
    return description || `Greip API error (code: ${errorBody.code || 'unknown'})`;
  }

  if (errorBody?.description) {
    return String(errorBody.description);
  }

  const statusCode = httpError?.response.status;

  if (statusCode === 401 || statusCode === 403) {
    return 'Authentication failed. Please check your API key.';
  }

  if (statusCode === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }

  if (statusCode === 404) {
    return 'Endpoint not found. Please check the API endpoint path.';
  }

  if (httpError && statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
    const errorMessage = errorBody?.description || errorBody?.message || errorBody?.error || httpError.message || 'Request failed';
    return `Request failed: ${errorMessage}`;
  }

  const originalMessage = error instanceof Error ? error.message || String(error) : String(error);
  return `Greip API error: ${originalMessage}`;
}

function toErrorBody({ body }: { body: unknown }): GreipErrorBody | undefined {
  const parsed: unknown = typeof body === 'string' ? parseJson({ text: body }) : body;
  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }
  return parsed;
}

function parseJson({ text }: { text: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function getErrorMessageByCode({ code }: { code?: number }): string {
  return ERROR_MESSAGES[code || 0] || 'An unknown error occurred.';
}

export const greipClient = { baseUrl, request };

const ERROR_MESSAGES: Record<number, string> = {
  101: 'The API Key is missing or invalid.',
  102: 'The API Key owner account is inactive. Please contact support.',
  103: 'You reached the usage limit of your account. Please upgrade your subscription.',
  104: 'Invalid parameters. Please check the parameter values.',
  105: 'Your plan has expired. Renew the subscription to enable using the API.',
  106: 'Too many requests detected. Please slow down your request rate.',
  107: 'The callback parameter value cannot be a function name.',
  108: 'Invalid format. Use JSON, XML, CSV, or Newline.',
  109: 'Callback feature can only be used with JSON format.',
  110: 'Invalid language. Use EN, AR, FR, DE, ES, JA, ZH, or RU.',
  111: 'Invalid mode. Use test or live.',
  112: 'The IP Address is not valid or empty.',
  113: 'Request sent from a domain that is not whitelisted in your API settings.',
  114: 'Security module is not available in the free plan. Please upgrade.',
  115: 'An error occurred while processing your request. Please try again later.',
  116: 'The Country Code is invalid or not found.',
  117: 'This feature is not available for your plan. Please upgrade.',
  118: 'The Phone Number is invalid or missing.',
  119: 'The Email Address is invalid or missing.',
  120: 'The BIN number is invalid or missing.',
  121: 'The AS Number is empty or invalid.',
  122: 'The IBAN is invalid or missing.',
  123: 'The user identifier is invalid or too long.',
  124: 'The user type is invalid or missing. Use email, phone, or user_id.',
  125: 'The user value is invalid or missing.',
  126: 'You have reached the limit of deletions for this day. Please wait until the next day.',
};

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
