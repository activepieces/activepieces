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
}: {
  auth: KlentyAuthValue;
  email: string;
}): Promise<KlentyProspect | null> {
  const prospect = await klentyRequest<KlentyProspect | null>({
    auth,
    method: HttpMethod.GET,
    path: '/prospects',
    queryParams: { Email: email },
  });

  return prospect ?? null;
}
