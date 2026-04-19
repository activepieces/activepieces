import { httpClient, HttpClientRequestType } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-framework';
import { NinjaPipeAuth } from './types';
import { extractItems } from './helpers';

export async function ninjapipeApiRequest(
  auth: NinjaPipeAuth,
  method: HttpMethod,
  endpoint: string,
  body?: Record<string, unknown>,
  qs?: Record<string, unknown>,
) {
  const baseUrl = auth.base_url.replace(/\/+$/, '');
  const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;

  const request: HttpClientRequestType = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${auth.api_key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    queryParams: qs,
  };

  if (body && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
    request.body = body;
  }

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export async function ninjapipeDatabinRequest(
  auth: NinjaPipeAuth,
  absoluteUrl: string,
  body: Record<string, unknown>,
) {
  if (!absoluteUrl.startsWith('https://')) {
    throw new Error('Databin webhook URL must be HTTPS');
  }
  if (!absoluteUrl.includes('/api/webhooks/')) {
    throw new Error('Databin webhook URL must contain /api/webhooks/');
  }

  const request: HttpClientRequestType = {
    method: HttpMethod.POST,
    url: absoluteUrl,
    headers: {
      Authorization: `Bearer ${auth.api_key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export async function getAllPages(
  auth: NinjaPipeAuth,
  endpoint: string,
  limit: number,
  qs?: Record<string, unknown>,
) {
  const allItems: unknown[] = [];
  let page = 1;
  const pageSize = qs?.limit ? Number(qs.limit) : 100;

  while (allItems.length < limit && page <= 1000) {
    const response = await ninjapipeApiRequest(auth, HttpMethod.GET, endpoint, undefined, {
      ...qs,
      page,
      limit: pageSize,
    });

    const items = extractItems(response);
    allItems.push(...items);

    if (items.length < pageSize) {
      break;
    }
    page++;
  }

  return allItems.slice(0, limit);
}

export async function findContactByEmail(
  auth: NinjaPipeAuth,
  email: string,
) {
  const response = await ninjapipeApiRequest(
    auth,
    HttpMethod.GET,
    '/contacts',
    undefined,
    { search: email, page: 1, limit: 100 },
  );

  const items = extractItems(response);
  const matched = items.find(
    (item: Record<string, unknown>) =>
      String(item.email || '').toLowerCase() === email.toLowerCase(),
  );

  return matched || null;
}
