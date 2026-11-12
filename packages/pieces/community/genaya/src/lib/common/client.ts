import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.genaya.com/v1';

async function request<T>({
  apiKey,
  method,
  path,
  body,
  query,
}: RequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      headers: { Accept: 'application/json' },
      queryParams: query,
      body,
    });
    return response.body;
  } catch (error) {
    throw toGenayaError(error);
  }
}

async function getOne<T>({ apiKey, path }: { apiKey: string; path: string }): Promise<T> {
  const response = await request<{ data: T }>({ apiKey, method: HttpMethod.GET, path });
  return response.data;
}

async function listPage<T>({
  apiKey,
  path,
  query,
}: {
  apiKey: string;
  path: string;
  query?: QueryParams;
}): Promise<ListPage<T>> {
  const response = await request<ListPage<T>>({
    apiKey,
    method: HttpMethod.GET,
    path,
    query: { limit: '100', ...query },
  });
  return {
    data: Array.isArray(response.data) ? response.data : [],
    has_more: response.has_more === true,
    next_cursor: response.next_cursor ?? null,
  };
}

// Lists are ordered by record id unless a created-date window is set, in which
// case they come back newest first. Pickers want the newest records on top, so
// they ask with an open window and fall back to the plain list on any error.
async function listNewestFirst<T>({ apiKey, path }: { apiKey: string; path: string }): Promise<T[]> {
  try {
    const page = await listPage<T>({ apiKey, path, query: { from: OPEN_WINDOW_START } });
    return page.data;
  } catch {
    const page = await listPage<T>({ apiKey, path });
    return page.data;
  }
}

function toGenayaError(error: unknown): GenayaApiError {
  if (error instanceof GenayaApiError) {
    return error;
  }
  if (error instanceof HttpError) {
    const status = error.response.status;
    const envelope = errorEnvelopeOf(error.response.body);
    const message = envelope.message ?? `Genaya answered with HTTP ${status}.`;
    const hint = hintFor({ status, code: envelope.code });
    return new GenayaApiError({
      status,
      code: envelope.code,
      message: hint ? `${message} ${hint}` : message,
    });
  }
  return new GenayaApiError({
    status: undefined,
    code: undefined,
    message: error instanceof Error ? error.message : String(error),
  });
}

function errorEnvelopeOf(body: unknown): { code?: string; message?: string } {
  let parsed: unknown = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { message: body.trim() === '' ? undefined : body.slice(0, 500) };
    }
  }
  if (!isRecord(parsed) || !isRecord(parsed['error'])) {
    return {};
  }
  const envelope = parsed['error'];
  return {
    code: typeof envelope['code'] === 'string' ? envelope['code'] : undefined,
    message: typeof envelope['message'] === 'string' ? envelope['message'] : undefined,
  };
}

function hintFor({ status, code }: { status: number; code?: string }): string | undefined {
  if (status === 401) {
    return 'Check that the API key is correct and has not been revoked (Genaya: Settings > Developer > API keys).';
  }
  if (code === 'test_mode_read_only') {
    return 'Test keys (gny_test_) can only read. Use a live key (gny_live_) to create or change records.';
  }
  if (code === 'insufficient_scope') {
    return 'Give the API key the missing scope in Genaya under Settings > Developer > API keys, or use a key without scope limits.';
  }
  if (code === 'endpoint_limit') {
    return 'An organization can have 10 webhook endpoints. Delete the ones you no longer use in Genaya under Settings > Developer > Webhooks, then turn the flow on again.';
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class GenayaApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor({ status, code, message }: { status: number | undefined; code: string | undefined; message: string }) {
    super(message);
    this.name = 'GenayaApiError';
    this.status = status;
    this.code = code;
  }
}

const OPEN_WINDOW_START = '2000-01-01';

export const genayaApi = {
  BASE_URL,
  request,
  getOne,
  listPage,
  listNewestFirst,
  isRecord,
};

export { GenayaApiError };

type RequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: QueryParams;
};

export type ListPage<T> = {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
};
