import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://a.klaviyo.com/api';
const REVISION = '2024-10-15';

export async function klaviyoApiCall<T>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.append(key, value);
    }
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: url.toString(),
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: REVISION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.body;
}

/**
 * Fetch all pages from a paginated Klaviyo endpoint, following `links.next` cursors.
 * Used by dropdown helpers to ensure all items are returned (not just the first page).
 */
export async function klaviyoPaginatedFetch<T>(
  apiKey: string,
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = null;
  let isFirst = true;

  while (isFirst || nextUrl) {
    isFirst = false;
    let url: string;

    if (nextUrl) {
      url = nextUrl;
    } else {
      const u = new URL(`${BASE_URL}${endpoint}`);
      if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
          u.searchParams.append(key, value);
        }
      }
      url = u.toString();
    }

    const response = await httpClient.sendRequest<{
      data: T[];
      links?: { next?: string | null };
    }>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: REVISION,
        Accept: 'application/json',
      },
    });

    const page = response.body;
    if (page.data) {
      results.push(...page.data);
    }

    nextUrl = page.links?.next ?? null;

    // Safety limit to avoid infinite loops on very large accounts
    if (results.length > 10000) break;
  }

  return results;
}
