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
    Object.entries(value).filter(
      ([, current]) =>
        current !== undefined && current !== null && current !== '',
    ),
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

/**
 * Normalise a Streak API collection response into an array.
 *
 * The Streak API is inconsistent:
 *  - /v1/pipelines returns a plain JSON array
 *  - /v1/pipelines/{key}/boxes returns { results: [...] }
 *  - /v1/pipelines/{key}/stages may return a **map** keyed by stage key
 *    (e.g. { "5001": { key: "5001", name: "Lead" }, ... })
 *
 * This helper handles all three shapes.
 */
export function extractCollection<T = Record<string, unknown>>(
  body: unknown,
): T[] {
  // Already an array — return directly
  if (Array.isArray(body)) {
    return body as T[];
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;

  // Check known wrapper keys first
  const wrapperKeys = [
    'results',
    'items',
    'boxes',
    'pipelines',
    'stages',
    'tasks',
  ];
  for (const key of wrapperKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
    // Handle map/object shape (e.g. stages keyed by stage key)
    if (
      candidate &&
      typeof candidate === 'object' &&
      !Array.isArray(candidate)
    ) {
      return Object.values(candidate) as T[];
    }
  }

  // Fallback: if body itself is a plain object with no known wrapper,
  // treat its values as the collection (covers the stages-as-root-map case)
  const values = Object.values(record);
  if (
    values.length > 0 &&
    values.every((v) => v && typeof v === 'object' && !Array.isArray(v))
  ) {
    return values as T[];
  }

  return [];
}

export function cleanPayload(payload: Record<string, unknown>) {
  return removeUndefined(payload);
}
