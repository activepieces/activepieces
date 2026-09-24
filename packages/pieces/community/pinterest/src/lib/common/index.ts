import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.pinterest.com/v5';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    // Handle Pinterest API specific error codes
    if (error.response?.status) {
      const status = error.response.status;
      const errorData = error.response.body;

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: ${
              errorData?.message ||
              'Invalid request parameters. Please check your input and try again.'
            }`
          );

        case 401:
          throw new Error(
            'Authentication Failed: Your Pinterest access token is invalid or expired. Please reconnect your Pinterest account.'
          );

        case 403:
          throw new Error(
            "Access Denied: You don't have permission to access this resource. Please check your Pinterest account permissions."
          );

        case 404:
          throw new Error(
            'Resource Not Found: The requested Pinterest resource (board, pin, etc.) could not be found. Please verify the resource exists.'
          );

        case 429:
          throw new Error(
            "Rate Limit Exceeded: You've exceeded Pinterest's API rate limits. Please wait a moment and try again."
          );

        case 500:
          throw new Error(
            "Pinterest Server Error: Pinterest's servers are experiencing issues. Please try again later."
          );

        case 502:
          throw new Error(
            "Bad Gateway: Pinterest's servers are temporarily unavailable. Please try again later."
          );

        case 503:
          throw new Error(
            "Service Unavailable: Pinterest's API service is temporarily down. Please try again later."
          );

        default:
          throw new Error(
            `Pinterest API Error (${status}): ${
              errorData?.message ||
              'An unexpected error occurred while communicating with Pinterest.'
            }`
          );
      }
    }

    // Handle network or other errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(
        'Network Error: Unable to connect to Pinterest API. Please check your internet connection and try again.'
      );
    }

    if (error.code === 'ETIMEDOUT') {
      throw new Error(
        'Request Timeout: The request to Pinterest API timed out. Please try again.'
      );
    }

    // Generic error fallback
    throw new Error(
      `Unexpected Error: ${
        error.message ||
        'An unexpected error occurred while processing your request.'
      }`
    );
  }
}

export function buildPath(
  basePath: string,
  params: Record<string, string | number | undefined>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query === '' ? basePath : `${basePath}?${query}`;
}

export function paginatedResult(response: {
  items?: unknown[];
  bookmark?: string | null;
}) {
  const items = response.items ?? [];
  return {
    items,
    count: items.length,
    bookmark: response.bookmark ?? null,
  };
}

export async function fetchAllPages({
  accessToken,
  path,
  maxPages = 2,
  pageSize = 250,
}: {
  accessToken: string;
  path: string;
  maxPages?: number;
  pageSize?: number | null;
}): Promise<{ items: unknown[]; truncated: boolean }> {
  let items: unknown[] = [];
  let bookmark: string | undefined = undefined;
  let truncated = false;

  for (let page = 0; page < maxPages; page++) {
    const query = [
      ...(pageSize === null ? [] : [`page_size=${pageSize}`]),
      ...(isNonEmptyString(bookmark)
        ? [`bookmark=${encodeURIComponent(bookmark)}`]
        : []),
    ];
    const response: unknown = await makeRequest(
      accessToken,
      HttpMethod.GET,
      appendQuery({ path, query })
    );

    if (!isRecord(response)) {
      break;
    }

    const pageItems = response['items'];
    items = Array.isArray(pageItems) ? [...items, ...pageItems] : items;

    const nextBookmark = response['bookmark'];

    if (!isNonEmptyString(nextBookmark) || nextBookmark === bookmark) {
      break;
    }

    bookmark = nextBookmark;
    truncated = page === maxPages - 1;
  }

  return { items: dedupeById(items), truncated };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function appendQuery({
  path,
  query,
}: {
  path: string;
  query: string[];
}): string {
  if (query.length === 0) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';

  return `${path}${separator}${query.join('&')}`;
}

function dedupeById(items: unknown[]): unknown[] {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    if (!isRecord(item)) {
      return true;
    }

    const id = item['id'];

    if (!isNonEmptyString(id)) {
      return true;
    }

    if (seenIds.has(id)) {
      return false;
    }

    seenIds.add(id);
    return true;
  });
}
