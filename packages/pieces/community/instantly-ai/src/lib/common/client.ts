import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { InstantlyPaginatedResponse, InstantlyWebhook } from './types';

const BASE_URL = 'https://api.instantly.ai/api/v2';

function buildUrl({
  path,
  query,
}: {
  path: string;
  query?: Record<string, string | undefined>;
}): string {
  const url = new URL(`${BASE_URL}/${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

function authHeaders(auth: string): Record<string, string> {
  return {
    Authorization: `Bearer ${auth}`,
    'Content-Type': 'application/json',
  };
}

async function makeRequest<T = unknown>({
  auth,
  method,
  path,
  body,
  query,
}: {
  auth: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | undefined>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: buildUrl({ path, query }),
    headers: authHeaders(auth),
    body,
  });

  return response.body;
}

async function listAllPages<T>({
  auth,
  path,
  method = HttpMethod.GET,
  body,
  query,
  maxPages = 50,
}: {
  auth: string;
  path: string;
  method?: HttpMethod;
  body?: Record<string, unknown>;
  query?: Record<string, string | undefined>;
  maxPages?: number;
}): Promise<T[]> {
  const result: T[] = [];
  let startingAfter: string | undefined = undefined;
  let page = 0;

  do {
    const paginationQuery = startingAfter
      ? { starting_after: startingAfter }
      : {};

    const requestQuery: Record<string, string | undefined> | undefined =
      method === HttpMethod.GET
        ? { ...query, limit: '100', ...paginationQuery }
        : query;

    const requestBody: Record<string, unknown> | undefined =
      method !== HttpMethod.GET
        ? { ...body, limit: 100, ...paginationQuery }
        : undefined;

    const response: InstantlyPaginatedResponse<T> =
      await makeRequest<InstantlyPaginatedResponse<T>>({
        auth,
        method,
        path,
        body: requestBody,
        query: requestQuery,
      });

    const items = response.items ?? [];
    result.push(...items);

    startingAfter = response.next_starting_after;
    page++;
  } while (startingAfter && page < maxPages);

  return result;
}

async function createWebhook({
  auth,
  webhookUrl,
  eventType,
  campaignId,
}: {
  auth: string;
  webhookUrl: string;
  eventType: string;
  campaignId?: string;
}): Promise<InstantlyWebhook> {
  const body: Record<string, unknown> = {
    target_hook_url: webhookUrl,
    event_type: eventType,
  };

  if (campaignId) {
    body['campaign'] = campaignId;
  }

  return makeRequest<InstantlyWebhook>({
    auth,
    method: HttpMethod.POST,
    path: 'webhooks',
    body,
  });
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: string;
  webhookId: string;
}): Promise<void> {
  await makeRequest({
    auth,
    method: HttpMethod.DELETE,
    path: `webhooks/${webhookId}`,
  });
}

export const instantlyClient = {
  makeRequest,
  listAllPages,
  createWebhook,
  deleteWebhook,
  BASE_URL,
};
