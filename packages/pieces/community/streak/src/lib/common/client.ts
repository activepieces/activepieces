import {
  AuthenticationType,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const STREAK_API_ROOT = 'https://api.streak.com/api';

export type StreakAuthValue = {
  api_key: string;
};

export function streakAuthentication(apiKey: string) {
  return {
    type: AuthenticationType.BASIC,
    username: apiKey,
    password: '',
  } as const;
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, current]) => current !== undefined && current !== null && current !== '')
  ) as T;
}

export async function streakRequest({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}) {
  return httpClient.sendRequest({
    method,
    url: `${STREAK_API_ROOT}${path}`,
    authentication: streakAuthentication(apiKey),
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    queryParams,
    body,
  });
}

export function extractCollection<T = Record<string, unknown>>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (!body || typeof body !== 'object') {
    return [];
  }
  const record = body as Record<string, unknown>;
  const candidates = [
    record['results'],
    record['items'],
    record['boxes'],
    record['pipelines'],
    record['stages'],
    record['tasks'],
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }
  return [];
}

export function cleanPayload(payload: Record<string, unknown>) {
  return removeUndefined(payload);
}
