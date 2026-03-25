import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { DEFAULT_PAGE_SIZE, KLENTY_API_BASE } from './constants';

export type KlentyAuthValue = AppConnectionValueForAuthProperty<typeof klentyAuth>;

export type KlentyProspect = {
  Email?: string;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  List?: string;
  [key: string]: unknown;
};

export function getKlentyBaseUrl(username: string): string {
  return `${KLENTY_API_BASE}/user/${encodeURIComponent(username)}`;
}

export async function klentyRequest<T = unknown>({
  auth,
  method,
  path,
  queryParams,
  body,
}: {
  auth: KlentyAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${getKlentyBaseUrl(auth.props.username)}${path}`,
    headers: {
      'x-API-key': auth.props.apiKey,
      api_key: auth.props.apiKey,
      accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    queryParams,
    body,
  });

  return response.body;
}

export async function findKlentyProspectByEmail({
  auth,
  email,
  listName,
}: {
  auth: KlentyAuthValue;
  email: string;
  listName?: string;
}): Promise<KlentyProspect | null> {
  let start = 1;

  while (start <= 10000) {
    const prospects = await klentyRequest<KlentyProspect[]>({
      auth,
      method: HttpMethod.GET,
      path: '/prospects',
      queryParams: {
        start: String(start),
        limit: String(DEFAULT_PAGE_SIZE),
        ...(listName ? { listName } : {}),
      },
    });

    const currentBatch = prospects ?? [];
    const match = currentBatch.find(
      (prospect) =>
        String(prospect.Email ?? '').toLowerCase() === email.toLowerCase(),
    );

    if (match) {
      return match;
    }

    if (currentBatch.length < DEFAULT_PAGE_SIZE) {
      return null;
    }

    start += DEFAULT_PAGE_SIZE;
  }

  return null;
}
