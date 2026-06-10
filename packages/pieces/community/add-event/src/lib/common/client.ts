import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { AddEventPage } from './types';

const BASE_URL = 'https://api.addevent.com/calevent/v2';
const MAX_PAGE_SIZE = 20;
const MAX_POLL_PAGES = 100;

async function apiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: AddEventApiCallParams): Promise<T> {
  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = Array.isArray(value)
          ? value.join(',')
          : String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    queryParams,
    body: compactBody(body),
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

async function getAllPages<T extends HttpMessageBody>({
  apiKey,
  resourceUri,
  select,
  query,
  maxPages,
}: {
  apiKey: string;
  resourceUri: string;
  select: (page: AddEventPage) => T[];
  query?: AddEventQuery;
  maxPages?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await apiCall<AddEventPage>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri,
      query: { ...query, page, page_size: MAX_PAGE_SIZE },
    });
    results.push(...select(response));
    totalPages = response.pagination.total_pages;
    page += 1;
  } while (page <= totalPages && (maxPages === undefined || page <= maxPages));

  return results;
}

// Polling: neither /subscribers nor /rsvps supports a "created after" filter, and
// the TIMEBASED cutoff jumps to the newest item each poll — so fetching a single
// page would permanently skip anything beyond it during a burst. Page through
// created-desc results until we cross the stored cutoff (MAX_POLL_PAGES is only a
// runaway backstop; the timestamp is the real stop condition).
async function getItemsSince<T extends HttpMessageBody>({
  apiKey,
  resourceUri,
  select,
  getCreated,
  sinceEpochMs,
  query,
  maxPages = MAX_POLL_PAGES,
}: {
  apiKey: string;
  resourceUri: string;
  select: (page: AddEventPage) => T[];
  getCreated: (item: T) => string;
  sinceEpochMs: number;
  query?: AddEventQuery;
  maxPages?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;
  let reachedCutoff = false;

  do {
    const response = await apiCall<AddEventPage>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri,
      query: {
        ...query,
        page,
        page_size: MAX_PAGE_SIZE,
        sort_by: 'created',
        sort_order: 'desc',
      },
    });
    for (const item of select(response)) {
      if (toEpochMs(getCreated(item)) > sinceEpochMs) {
        results.push(item);
      } else {
        reachedCutoff = true;
      }
    }
    totalPages = response.pagination.total_pages;
    page += 1;
  } while (!reachedCutoff && page <= totalPages && page <= maxPages);

  return results;
}

function toEpochMs(created: string): number {
  return new Date(created.replace(' ', 'T')).getTime();
}

// AddEvent treats an omitted field as "no change" (or its default); an explicit
// null or empty value would instead overwrite existing data or be rejected.
// Blank optional inputs reach us as null (dropdowns), false (checkboxes — handled
// at the prop level for updates), or {} (objects), so strip nil/empty top-level
// values before sending. Shallow only — never mutate user-supplied nested data.
function compactBody(body: unknown): unknown {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  const entries = Object.entries(body).filter(
    ([, value]) => !isNilOrEmptyObject(value)
  );
  return Object.fromEntries(entries);
}

function isNilOrEmptyObject(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

export const addEventApi = {
  baseUrl: BASE_URL,
  maxPageSize: MAX_PAGE_SIZE,
  call: apiCall,
  getAllPages,
  getItemsSince,
  toEpochMs,
};

export type AddEventQuery = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export type AddEventApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: AddEventQuery;
  body?: unknown;
};
