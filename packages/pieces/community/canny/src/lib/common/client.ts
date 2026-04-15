import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const CANNY_API_BASE = 'https://canny.io/api/v1';

/**
 * All Canny API endpoints use POST with JSON body.
 * Authentication is via an `apiKey` field in the request body.
 */
export async function cannyRequest<T = unknown>({
  apiKey,
  path,
  body,
}: {
  apiKey: string;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${CANNY_API_BASE}${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      apiKey: apiKey.trim(),
      ...body,
    },
  });

  return response.body;
}

/**
 * Strip undefined/null/empty-string values from an object before sending.
 */
export function cleanBody(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  );
}
