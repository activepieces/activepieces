import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { KlaviyoAuthValue, getAuthorizationHeader } from './auth';

export async function fetchProfilesByIds(
  auth: KlaviyoAuthValue,
  ids: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const CHUNK_SIZE = 100;
  const profileMap = new Map<string, Record<string, unknown>>();

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const params = new URLSearchParams();
    params.set('filter', `any(id,${JSON.stringify(chunk)})`);
    params.set('page[size]', String(CHUNK_SIZE));

    const response = await makeRequest(auth, HttpMethod.GET, `/profiles?${params.toString()}`);
    for (const profile of (response.data as any[]) ?? []) {
      profileMap.set(profile.id as string, profile.attributes as Record<string, unknown>);
    }
  }

  return profileMap;
}

export function normalizeProfileIds(value: unknown): string[] {
  if (Array.isArray(value)) return (value as string[]).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return (parsed as string[]).filter(Boolean);
      } catch {
        // not a JSON array, fall through to treat as single ID
      }
    }
    return [trimmed].filter(Boolean);
  }
  return [];
}

export const BASE_URL = `https://a.klaviyo.com/api`;

export async function makeRequest(
  auth: KlaviyoAuthValue,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: getAuthorizationHeader(auth),
        accept: 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
        revision: '2025-04-15',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        'Authentication failed. Please check your API key or access token.'
      );
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    }

    if (error.response?.status >= 400 && error.response?.status < 500) {
      throw new Error(
        `Client error: ${
          error.response?.body?.message || JSON.stringify(error.response?.body)
        }`
      );
    }

    if (error.response?.status >= 500) {
      throw new Error('Server error from Klaviyo API. Please try again later.');
    }

    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
