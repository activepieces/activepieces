import { httpClient, HttpMethod } from '@activepieces/pieces-common';

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
}: ZoteroRequestParams): Promise<T> {
  const url = new URL(`${ZOTERO_BASE_URL}${libraryPath(userOrGroup, libraryId)}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const response = await httpClient.sendRequest<T>({
    method,
    url: url.toString(),
    headers: {
      'Zotero-API-Key': apiKey,
      'Zotero-API-Version': '3',
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
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
