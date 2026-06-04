import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { SliteChildrenResponse, SliteNote } from './types';

const BASE_URL = 'https://api.slite.com/v1';
const MAX_CHILDREN_PAGES = 100;

async function apiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: SliteApiCallParams): Promise<T> {
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
    headers: {
      'x-slite-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams,
    body: compactBody(body),
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

async function getAllChildren({
  apiKey,
  noteId,
  maxPages = MAX_CHILDREN_PAGES,
}: {
  apiKey: string;
  noteId: string;
  maxPages?: number;
}): Promise<SliteNote[]> {
  const notes: SliteNote[] = [];
  let cursor: string | undefined = undefined;
  let pages = 0;

  do {
    const response: SliteChildrenResponse = await apiCall<SliteChildrenResponse>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri: `/notes/${noteId}/children`,
      query: cursor ? { cursor } : undefined,
    });
    notes.push(...(response.notes ?? []));
    cursor =
      response.hasNextPage && response.nextCursor
        ? response.nextCursor
        : undefined;
    pages += 1;
  } while (cursor && pages < maxPages);

  return notes;
}

// Slite authenticates with a custom header, and an omitted body field means
// "leave unchanged". Blank optional inputs reach us as null (dropdowns) or {}/[]
// (objects/arrays), so strip nil/empty top-level values before sending to avoid
// clobbering existing doc content on replace/update. Shallow only — never mutate
// nested user-supplied data.
function compactBody(body: unknown): unknown {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  const entries = Object.entries(body).filter(
    ([, value]) => !isNilOrEmpty(value)
  );
  return Object.fromEntries(entries);
}

function isNilOrEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === 'object' && Object.keys(value).length === 0;
}

export const sliteApi = {
  baseUrl: BASE_URL,
  call: apiCall,
  getAllChildren,
};

export type SliteQuery = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export type SliteApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: SliteQuery;
  body?: unknown;
};
