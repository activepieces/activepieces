import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { InstantlyPaginatedResponse, InstantlyWebhook } from './types';

const BASE_URL = 'https://api.instantly.ai/api/v2';

function definedQueryParams(
  query: Record<string, string | undefined> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query ?? {}).filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && entry[1] !== '',
    ),
  );
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
    url: `${BASE_URL}/${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    queryParams: definedQueryParams(query),
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
  maxPages,
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
  let pageWasEmpty = false;

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
    pageWasEmpty = items.length === 0;
    page++;
  } while (
    startingAfter &&
    !pageWasEmpty &&
    (maxPages === undefined || page < maxPages)
  );

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
