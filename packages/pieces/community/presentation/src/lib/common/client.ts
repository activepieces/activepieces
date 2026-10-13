import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.presenton.ai';

async function request<T>({
  auth,
  method,
  path,
  queryParams,
  body,
  headers,
}: {
  auth: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const query = Object.fromEntries(
    Object.entries(queryParams ?? {}).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: { Authorization: `Bearer ${auth}`, ...headers },
      queryParams: query,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new Error(
        `Presenton API error (${status}): ${JSON.stringify(error.response.body)}`
      );
    }
    throw error;
  }
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.filter((item): item is string => typeof item === 'string');
}

function dropUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

export const presentonClient = { request: request, toStringArray, dropUndefined };
