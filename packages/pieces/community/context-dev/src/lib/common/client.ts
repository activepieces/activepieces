import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const CONTEXT_API_BASE_URL = 'https://api.context.dev/v1';

export async function contextApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: ContextApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${CONTEXT_API_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}

export function toQueryParams(
  values: Record<string, string | number | boolean | undefined>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry) => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  );
}

export function flattenRecord(
  value: unknown,
  prefix = ''
): Record<string, FlatValue> {
  if (!isRecord(value)) {
    return {};
  }

  const result: Record<string, FlatValue> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;
    if (nestedValue === null || nestedValue === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(nestedValue)) {
      result[flatKey] = nestedValue.map(formatArrayValue).join(', ');
    } else if (isRecord(nestedValue)) {
      Object.assign(result, flattenRecord(nestedValue, flatKey));
    } else if (
      typeof nestedValue === 'string' ||
      typeof nestedValue === 'number' ||
      typeof nestedValue === 'boolean'
    ) {
      result[flatKey] = nestedValue;
    }
  }

  return result;
}

function formatArrayValue(value: unknown): string {
  if (isRecord(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return String(value ?? '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type ContextApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
};

type FlatValue = string | number | boolean | null;
