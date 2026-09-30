import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import jwt from 'jsonwebtoken';

type QueryValue = string | number | boolean | undefined | null;

export type GhostAuthValue = {
  props: {
    baseUrl: string;
    apiKey: string;
  };
};

export type GhostPagination = {
  page: number | null;
  limit: number | string | null;
  total_pages: number | null;
  total: number | null;
  next: number | null;
  prev: number | null;
};

export class GhostApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const errorText = (error: Record<string, unknown>): string =>
  [error['message'], error['context']]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ');

const describeError = ({ status, body }: { status: number; body: unknown }): string => {
  const errors = isRecord(body) && Array.isArray(body['errors']) ? body['errors'].filter(isRecord) : [];
  const detail =
    errors.length > 0
      ? errors.map(errorText).join('; ')
      : typeof body === 'string'
      ? body
      : JSON.stringify(body);
  if (status === 401 || status === 403) {
    return `Ghost rejected the Admin API key (${status}). Check the API URL and the Admin API Key of the custom integration. ${detail}`;
  }
  if (status === 404) {
    return `Ghost could not find the requested resource (404). Check the ID or slug. ${detail}`;
  }
  if (status === 409) {
    return `Ghost reported an update collision (409): the record changed while it was being saved. Retry the action. ${detail}`;
  }
  if (status === 422) {
    return `Ghost rejected the request (422). ${detail}`;
  }
  if (status === 429) {
    return `Ghost rate limit reached (429). Wait a moment and retry. ${detail}`;
  }
  return `Ghost API request failed (${status}). ${detail}`;
};

const signToken = (apiKey: string): string => {
  const [id, secret] = (apiKey ?? '').trim().split(':');
  if (!id || !secret) {
    throw new Error(
      'The Admin API Key must look like "<id>:<secret>". Copy the Admin API Key of the custom integration from Ghost Settings > Advanced > Integrations.'
    );
  }
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    expiresIn: '5m',
    audience: '/admin/',
  });
};

const toQueryParams = (query?: Record<string, QueryValue>): Record<string, string> => {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  }
  return params;
};

export const ghostClient = {
  adminUrl(auth: GhostAuthValue): string {
    return `${auth.props.baseUrl.trim().replace(/\/+$/, '')}/ghost/api/admin`;
  },
  async request<T>({
    auth,
    method,
    path,
    query,
    body,
    headers,
  }: {
    auth: GhostAuthValue;
    method: HttpMethod;
    path: string;
    query?: Record<string, QueryValue>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<T> {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${ghostClient.adminUrl(auth)}${path}`,
        headers: {
          ...(headers ?? {}),
          Authorization: `Ghost ${signToken(auth.props.apiKey)}`,
        },
        queryParams: toQueryParams(query),
        body,
      });
      return response.body;
    } catch (error) {
      const response = isRecord(error) && isRecord(error['response']) ? error['response'] : undefined;
      const status = response && typeof response['status'] === 'number' ? response['status'] : undefined;
      if (response && status) {
        throw new GhostApiError(describeError({ status, body: response['body'] }), status);
      }
      throw error;
    }
  },
};

export const ghostCommon = {
  pagination(meta: unknown): GhostPagination {
    const pagination = isRecord(meta) && isRecord(meta['pagination']) ? meta['pagination'] : {};
    const numberOrNull = (value: unknown): number | null => (typeof value === 'number' ? value : null);
    const limit = pagination['limit'];
    return {
      page: numberOrNull(pagination['page']),
      limit: typeof limit === 'number' || typeof limit === 'string' ? limit : null,
      total_pages: numberOrNull(pagination['pages']),
      total: numberOrNull(pagination['total']),
      next: numberOrNull(pagination['next']),
      prev: numberOrNull(pagination['prev']),
    };
  },
  isRecord,
  records(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value) ? value.filter(isRecord) : [];
  },
  listQuery(props: {
    filter?: string | null;
    limit?: number | null;
    page?: number | null;
    order?: string | null;
  }): Record<string, QueryValue> {
    const limit =
      props.limit === undefined || props.limit === null
        ? 15
        : Math.min(Math.max(Math.trunc(props.limit), 1), 100);
    return {
      filter: props.filter?.trim(),
      limit,
      page: props.page ?? 1,
      order: props.order?.trim(),
    };
  },
  nqlString(value: string): string {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  },
  id(value: string, label: string): string {
    const text = (value ?? '').trim();
    if (!text) {
      throw new Error(`${label} is required.`);
    }
    return encodeURIComponent(text);
  },
  stringList(value: unknown): string[] | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const items = Array.isArray(value) ? value : [value];
    const list = items
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const first = Object.values(item).find((entry) => typeof entry === 'string');
          return typeof first === 'string' ? first : '';
        }
        return String(item ?? '');
      })
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return list.length > 0 ? list : undefined;
  },
  triState(value: unknown): boolean | undefined {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return undefined;
  },
  hasText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  },
  first<T>(items: T[] | undefined, resource: string): T {
    if (!items || items.length === 0) {
      throw new Error(`Ghost returned no ${resource}.`);
    }
    return items[0];
  },
  futureDate(value: unknown, label: string): string {
    const date = new Date(String(value ?? ''));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`${label} must be a valid date and time.`);
    }
    if (date.getTime() <= Date.now()) {
      throw new Error(`${label} must be in the future.`);
    }
    return date.toISOString();
  },
};
