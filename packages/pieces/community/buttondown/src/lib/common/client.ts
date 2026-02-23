import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BUTTONDOWN_BASE_URL = 'https://api.buttondown.com/v1';

type QueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | undefined;

export interface ButtondownRequest {
  auth: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

export interface ButtondownPagedResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

interface ButtondownErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
  [key: string]: unknown;
}

const sanitizeHeaders = (headers: Record<string, string | undefined> = {}) =>
  Object.fromEntries(
    Object.entries(headers).filter(([, value]) => value !== undefined)
  );

const serializeQueryParams = (
  query?: Record<string, QueryValue>
): Record<string, string> | undefined => {
  if (!query) {
    return undefined;
  }

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      result[key] = value.map((item) => String(item)).join(',');
      continue;
    }

    result[key] = String(value);
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

export const buttondownRequest = async <TResponse>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: ButtondownRequest): Promise<TResponse> => {
  try {
    const response = await httpClient.sendRequest<TResponse>({
      method,
      url: `${BUTTONDOWN_BASE_URL}${path}`,
      headers: {
        Authorization: `Token ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...sanitizeHeaders(headers),
      },
      queryParams: serializeQueryParams(query),
      body,
    });

    return response.body;
  } catch (unknownError: unknown) {
    const error = unknownError as {
      response?: { status?: number; body?: ButtondownErrorResponse };
      message?: string;
    };

    const status = error.response?.status;
    const responseBody = error.response?.body ?? {};
    const message =
      responseBody.detail ??
      responseBody.error ??
      responseBody.message ??
      (responseBody.errors && responseBody.errors.length > 0
        ? responseBody.errors
            .map((err) => err.message ?? JSON.stringify(err))
            .join(', ')
        : undefined) ??
      error.message ??
      'Unexpected Buttondown API error';

    throw new Error(
      `Buttondown API request failed${status ? ` (status ${status})` : ''}: ${message}`
    );
  }
};
