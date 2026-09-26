import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

type QueryValue = string | number | boolean | undefined;

interface CalPagination {
  nextCursor: string | null;
  hasMore: boolean;
}

interface CalEnvelope<T> {
  status: 'success' | 'error';
  data: T;
  pagination?: CalPagination;
}

function toQueryParams(
  query?: Record<string, QueryValue>
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      params[key] = String(value);
    }
  }
  return params;
}

function mapCalError(error: unknown): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const status = error.response.status;
  const body = error.response.body as
    | { error?: { message?: string }; message?: string }
    | undefined;
  const message = body?.error?.message ?? body?.message ?? JSON.stringify(body);

  if (status === 403) {
    return new Error(`Cal.com API key is not authorized for this request: ${message}`);
  }
  if (status === 404) {
    return new Error(`Cal.com resource not found: ${message}`);
  }
  if (status === 429) {
    return new Error(`Cal.com API rate limit exceeded: ${message}`);
  }
  return new Error(`Cal.com API error (${status}): ${message}`);
}

interface CalRequestParams {
  apiKey: string;
  method: HttpMethod;
  path: string;
  version?: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
}

async function sendCalRequest<T>(params: CalRequestParams): Promise<CalEnvelope<T> | undefined> {
  const { apiKey, method, path, version, query, body } = params;
  const request: HttpRequest = {
    method,
    url: `https://api.cal.com/v2${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: version ? { 'cal-api-version': version } : undefined,
    queryParams: toQueryParams(query),
    body,
  };

  let response;
  try {
    response = await httpClient.sendRequest<CalEnvelope<T>>(request);
  } catch (error) {
    throw mapCalError(error);
  }
  if (!response.body) {
    return undefined;
  }
  if (response.body.status === 'error') {
    throw new Error(`Cal.com API returned an error: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function calRequest<T>(params: CalRequestParams): Promise<T> {
  const envelope = await sendCalRequest<T>(params);
  return envelope?.data as T;
}

async function calRequestPaginated<T>(
  params: CalRequestParams
): Promise<{ data: T; nextCursor: string | null; hasMore: boolean }> {
  const envelope = await sendCalRequest<T>(params);
  return {
    data: envelope?.data as T,
    nextCursor: envelope?.pagination?.nextCursor ?? null,
    hasMore: envelope?.pagination?.hasMore ?? false,
  };
}

export const calcomCommon = {
  calRequest,
  calRequestPaginated,
  versions: {
    eventTypes: '2026-06-12',
    bookingsList: '2026-05-01',
    bookingsItem: '2026-02-25',
    attendees: '2024-08-13',
    slots: '2024-09-04',
    schedules: '2024-06-11',
  },
};
