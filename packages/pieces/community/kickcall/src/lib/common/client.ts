import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { KICKCALL_BASE_URL } from './constants';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectionRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  const nestedKeys = ['data', 'locations', 'agents', 'items', 'results'];
  for (const key of nestedKeys) {
    const nested = payload[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}

function totalPages(payload: unknown): number | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  const meta = payload['meta'];
  if (!isRecord(meta)) {
    return undefined;
  }
  const value = meta['total_pages'];
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return undefined;
}

function namedOptionsFromCollection(payload: unknown): {
  label: string;
  value: string;
}[] {
  return collectionRows(payload).flatMap((row) => {
    if (!isRecord(row)) {
      return [];
    }
    const id =
      row['id'] ??
      row['location_id'] ??
      row['agent_id'] ??
      row['kickcall_agent_id'];
    if (id === null || id === undefined) {
      return [];
    }
    const name =
      row['name'] ??
      row['label'] ??
      row['agent_name'] ??
      row['location_name'] ??
      String(id);
    return [
      {
        label: String(name),
        value: String(id),
      },
    ];
  });
}

async function bearerRequest<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: KickcallAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${KICKCALL_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.props.apiKey,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

function requestedPerPage(queryParams: Record<string, string> | undefined): number {
  const raw = queryParams?.['per_page'];
  if (raw === undefined) {
    return 100;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }
  return Math.floor(parsed);
}

async function bearerRequestAllPages({
  auth,
  path,
  queryParams,
}: {
  auth: KickcallAuth;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<{ data: unknown[] }> {
  const rows: unknown[] = [];
  let page = 1;
  const maxPages = 100;
  const perPage = requestedPerPage(queryParams);
  while (page <= maxPages) {
    const payload = await bearerRequest({
      auth,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        per_page: String(perPage),
        page: String(page),
      },
    });
    const pageRows = collectionRows(payload);
    rows.push(...pageRows);
    const pages = totalPages(payload);
    if (pages !== undefined) {
      if (page >= pages) {
        break;
      }
    } else if (pageRows.length === 0 || pageRows.length < perPage) {
      break;
    }
    page += 1;
  }
  return { data: rows };
}

async function marketplaceRequest<T extends HttpMessageBody>({
  auth,
  path,
  body,
}: {
  auth: KickcallAuth;
  path: string;
  body: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${KICKCALL_BASE_URL}${path}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: {
      ...body,
      apiKey: auth.props.apiKey,
    },
  });
  return response.body;
}

export const kickcallClient = {
  bearerRequest,
  bearerRequestAllPages,
  marketplaceRequest,
  namedOptionsFromCollection,
};

export type KickcallAuth = AppConnectionValueForAuthProperty<typeof kickcallAuth>;
