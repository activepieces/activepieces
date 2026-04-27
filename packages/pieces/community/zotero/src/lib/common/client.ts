import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface ZoteroResponse<T> {
  body: T;
  lastModifiedVersion: number;
}

async function sendRequest<T>(apiKey: string, method: HttpMethod, url: string, body?: object): Promise<ZoteroResponse<T>> {
  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers: {
      'Zotero-API-Key': apiKey,
      'Zotero-API-Version': '3',
      'Content-Type': 'application/json',
    },
    body,
  });
  const lastModifiedVersion = parseInt(
    (response.headers as Record<string, string>)['last-modified-version'] ?? '0',
    10,
  );
  return { body: response.body, lastModifiedVersion };
}

function libraryPath(userOrGroup: string, libraryId: string): string {
  const prefix = userOrGroup === 'user' ? 'users' : 'groups';
  return `/${prefix}/${libraryId}`;
}

export async function makeZoteroRequest<T>({
  apiKey,
  userOrGroup,
  libraryId,
  method,
  endpoint,
  body,
  params,
}: ZoteroRequestParams): Promise<ZoteroResponse<T>> {
  const url = new URL(`${ZOTERO_BASE_URL}${libraryPath(userOrGroup, libraryId)}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return sendRequest<T>(apiKey, method, url.toString(), body);
}

export const ZOTERO_BASE_URL = 'https://api.zotero.org';

export interface ZoteroRequestParams {
  apiKey: string;
  userOrGroup: string;
  libraryId: string;
  method: HttpMethod;
  endpoint: string;
  body?: object;
  params?: Record<string, string>;
}

export interface ZoteroItem {
  key: string;
  version: number;
  library: { type: string; id: number; name: string };
  data: {
    key: string;
    version: number;
    itemType: string;
    title: string;
    creators: { creatorType: string; firstName?: string; lastName?: string; name?: string }[];
    abstractNote: string;
    url: string;
    date: string;
    language: string;
    tags: { tag: string }[];
    collections: string[];
    dateAdded: string;
    dateModified: string;
  };
}
