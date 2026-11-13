import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { PocketbaseAuthResponse, PocketbaseAuthValue, PocketbaseRecordPage } from './types';

function baseUrl({ auth }: { auth: PocketbaseAuthValue }): string {
  return auth.props.host.replace(/\/+$/, '');
}

async function authenticate({ auth }: { auth: PocketbaseAuthValue }): Promise<PocketbaseAuthResponse> {
  const response = await httpClient.sendRequest<PocketbaseAuthResponse>({
    method: HttpMethod.POST,
    url: `${baseUrl({ auth })}/api/collections/_superusers/auth-with-password`,
    body: {
      identity: auth.props.email,
      password: auth.props.password,
    },
  });
  return response.body;
}

async function request<T>({ auth, ...params }: RequestParams & { auth: PocketbaseAuthValue }): Promise<T> {
  const token = await getToken({ auth });
  return await send<T>({ auth, token, ...params });
}

async function paginate<T>({ auth, path, query }: PaginateParams & { auth: PocketbaseAuthValue }): Promise<{ items: T[]; totalItems: number }> {
  const token = await getToken({ auth });

  let allItems: T[] = [];
  let page = 1;
  let serverTotalItems = 0;

  while (true) {
    const body = await send<PocketbaseRecordPage<T>>({
      auth,
      token,
      method: HttpMethod.GET,
      path,
      query: { page: String(page), perPage: String(PAGE_SIZE), skipTotal: 'false', ...query },
    });

    if (!body.items || body.items.length === 0) break;
    serverTotalItems = body.totalItems;
    allItems = allItems.concat(body.items);

    if (allItems.length >= body.totalItems) break;
    page++;
  }

  return { items: allItems, totalItems: serverTotalItems };
}

async function getToken({ auth }: { auth: PocketbaseAuthValue }): Promise<string> {
  const response = await authenticate({ auth });
  const token = response?.token;
  if (!token) {
    throw new Error('Authentication failed: no token returned from PocketBase.');
  }
  return token;
}

async function send<T>({ auth, token, method, path, query, body, responseType }: RequestParams & { auth: PocketbaseAuthValue; token: string }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    queryParams: query,
    body,
    responseType,
  });
  return response.body;
}

export const pocketbaseClient = { baseUrl, authenticate, getToken, request, paginate };

const PAGE_SIZE = 200;

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown; responseType?: 'arraybuffer' };
type PaginateParams = { path: string; query?: QueryParams };
