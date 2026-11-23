import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { isNil, tryCatch } from '@activepieces/pieces-framework';

const TINKO_BASE_URL = 'https://api.tinko.com.br/v1';
const MAX_PAGE_SIZE = 100;
const DEFAULT_MAX_ITEMS = 500;

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Tinko could not process the request',
  401: 'The Tinko API token is missing or invalid',
  403: 'Tinko denied access to this resource',
  404: 'The requested Tinko resource could not be found',
  409: 'The request conflicts with the current state of the resource in Tinko',
  422: 'Tinko rejected the request because one or more fields are invalid',
  429: 'The Tinko API rate limit was reached, try again in a minute',
};

async function request<T>({
  token,
  method,
  path,
  body,
  queryParams,
}: TinkoRequestParams): Promise<T> {
  const result = await tryCatch(() =>
    httpClient.sendRequest<T>({
      method,
      url: `${TINKO_BASE_URL}${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: token.trim() },
      headers: { Accept: 'application/json' },
      queryParams: compactQuery(queryParams),
      body,
    })
  );
  if (result.error) {
    throw toTinkoApiError(result.error);
  }
  return result.data.body;
}

async function listAll<T>({
  token,
  path,
  queryParams,
  maxItems = DEFAULT_MAX_ITEMS,
}: TinkoListParams): Promise<T[]> {
  const perPage = Math.min(maxItems, MAX_PAGE_SIZE);
  const collect = async (page: number, acc: T[]): Promise<T[]> => {
    const response = await request<TinkoListResponse<T>>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        page: String(page),
        per_page: String(perPage),
      },
    });
    const data = Array.isArray(response.data) ? response.data : [];
    const items = [...acc, ...data];
    const currentPage = Number(response.pagination?.current_page ?? page);
    const lastPage = Number(response.pagination?.last_page ?? page);
    if (items.length >= maxItems || data.length === 0 || currentPage >= lastPage) {
      return items.slice(0, maxItems);
    }
    return collect(page + 1, items);
  };
  return collect(1, []);
}

function pathFor(...segments: string[]): string {
  return '/' + segments.map((segment) => encodeURIComponent(segment.trim())).join('/');
}

function compactQuery(
  queryParams: Record<string, string | undefined> | undefined
): Record<string, string> | undefined {
  if (isNil(queryParams)) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(queryParams).filter(
      (entry): entry is [string, string] => !isNil(entry[1]) && entry[1] !== ''
    )
  );
}

function toTinkoApiError(error: unknown): TinkoApiError {
  if (!(error instanceof HttpError)) {
    return new TinkoApiError({
      status: 0,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  const status = error.response.status;
  const body = parseBody(error.response.body);
  const baseMessage =
    status === 403 && body['upgrade_required'] === true
      ? 'The current Tinko plan does not include API access'
      : STATUS_MESSAGES[status] ??
        (status >= 500
          ? 'Tinko is unavailable or returned an unexpected response'
          : `The Tinko API returned status ${status}`);
  const details = describeDetails(body);
  return new TinkoApiError({
    status,
    message: details === '' ? baseMessage : `${baseMessage}: ${details}`,
  });
}

function parseBody(body: unknown): Record<string, unknown> {
  if (typeof body === 'string') {
    const parsed = tryParseJson(body);
    return isRecord(parsed) ? parsed : {};
  }
  return isRecord(body) ? body : {};
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function describeDetails(body: Record<string, unknown>): string {
  const message = typeof body['message'] === 'string' ? body['message'] : '';
  const errors = Array.isArray(body['errors']) ? body['errors'] : [];
  const errorLines = errors.filter(isRecord).map((entry) => {
    const label = [entry['code'], entry['field']]
      .filter((part): part is string => typeof part === 'string' && part !== '')
      .join(' ');
    const detail = typeof entry['message'] === 'string' ? entry['message'] : '';
    return [label, detail].filter((part) => part !== '').join(': ');
  });
  const retry =
    body['retry_after'] !== undefined ? [`retry after ${String(body['retry_after'])} seconds`] : [];
  return [message, ...errorLines, ...retry]
    .filter((part) => part !== '')
    .join(' | ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class TinkoApiError extends Error {
  readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'TinkoApiError';
    this.status = status;
  }
}

export const tinkoClient = {
  request,
  listAll,
  pathFor,
  isRecord,
};

export const TINKO_API_BASE_URL = TINKO_BASE_URL;

export type TinkoRequestParams = {
  token: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | undefined>;
};

export type TinkoListParams = {
  token: string;
  path: string;
  queryParams?: Record<string, string | undefined>;
  maxItems?: number;
};

export type TinkoListResponse<T> = {
  success?: boolean;
  data?: T[];
  pagination?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
};

export type TinkoItemResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type TinkoChannel = {
  id: string;
  name: string;
  type?: string;
  status?: string;
};

export type TinkoUser = {
  id: string;
  name: string;
  email?: string;
};

export type TinkoTag = {
  id: string;
  text: string;
  emoji?: string | null;
  color?: string | null;
  created_at?: string;
};

export type TinkoTemplate = {
  id: string;
  name: string;
  language?: string;
  category?: string;
  status?: string;
};

export type TinkoCustomField = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select';
  placeholder?: string | null;
  options?: string[] | null;
  is_active?: boolean;
};

export type TinkoContact = {
  id: string;
  phone: string;
  name: string | null;
  avatar?: string | null;
  type?: string | null;
  blocked?: boolean;
  customfields?: Record<string, unknown> | unknown[];
  tags?: { id: string; name: string }[];
  created_at?: string;
  updated_at?: string;
};

export type TinkoNote = {
  id: string;
  content: string;
  user?: { id?: string; name?: string } | null;
  created_at?: string;
};

export type TinkoSendMessageResult = {
  message?: {
    id?: string;
    content?: string | null;
    type?: string;
    direction?: string;
    visibility?: string;
    created_at?: string;
  };
  chat?: { id?: string; status?: string; is_open?: boolean };
  contact?: { phone?: string; name?: string | null };
};
