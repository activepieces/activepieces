import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';

export const GREENHOUSE_BASE_URL = 'https://harvest.greenhouse.io/v1';

export type GreenhouseAuthValue = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

type GreenhouseRequestParams = {
  auth: GreenhouseAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
  onBehalfOf?: number | string;
};

export function greenhouseBasicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

export async function greenhouseRequest<T = unknown>({
  auth,
  method,
  path,
  queryParams,
  body,
  onBehalfOf,
}: GreenhouseRequestParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${GREENHOUSE_BASE_URL}${path}`,
    queryParams,
    body,
    headers: {
      Authorization: greenhouseBasicAuthHeader(auth.secret_text),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(onBehalfOf !== undefined && onBehalfOf !== ''
        ? { 'On-Behalf-Of': String(onBehalfOf) }
        : {}),
    },
  });

  return response.body;
}

export function compactObject<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === '') {
        return false;
      }

      if (Array.isArray(entry) && entry.length === 0) {
        return false;
      }

      return true;
    }),
  );
}
