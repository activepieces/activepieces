import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const ADAPTLYPOST_API_URL = 'https://post.adaptlypost.com/post/api/v1';

type QueryValue = string | number | boolean | string[] | undefined | null;

export class AdaptlyPostApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const STATUS_HINTS: Record<number, string> = {
  401: 'AdaptlyPost rejected the API key (401).',
  403: "The API key's role can't do this (403).",
  404: "AdaptlyPost couldn't find it (404).",
  429: 'AdaptlyPost rate limit reached (429). Try again in a minute.',
};

async function request<T>({
  apiKey,
  method,
  path,
  query,
  body,
}: RequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${ADAPTLYPOST_API_URL}${path}${toQueryString(query)}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      body,
    });
    return response.body;
  } catch (error) {
    throw toApiError(error);
  }
}

async function uploadToSignedUrl({
  url,
  data,
  mimeType,
}: {
  url: string;
  data: Buffer;
  mimeType: string;
}): Promise<void> {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url,
      headers: { 'Content-Type': mimeType },
      body: data,
    });
  } catch (error) {
    throw toApiError(error);
  }
}

function toQueryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function toApiError(error: unknown): Error {
  if (!(error instanceof HttpError))
    return error instanceof Error ? error : new Error(String(error));
  const { status, body } = error.response;
  const hint = STATUS_HINTS[status] ?? `AdaptlyPost returned ${status}.`;
  return new AdaptlyPostApiError(status, `${hint} ${readMessage(body)}`.trim());
}

function readMessage(body: unknown): string {
  if (typeof body === 'string') return body;
  if (typeof body !== 'object' || body === null) return '';
  const message = (body as Record<string, unknown>)['message'];
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : '';
}

export const adaptlyPostClient = { request, uploadToSignedUrl, toQueryString };

type RequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};
