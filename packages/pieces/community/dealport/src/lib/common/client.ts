import {
  HttpError,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const DEALPORT_BASE_URL = 'https://app.dealport.com/api/v1';

const SAFE_RECORD_ID_RE = /^[A-Za-z0-9_-]{4,64}$/;
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function splitCsvList(value: string | undefined | null): string[] | undefined {
  if (!value || !value.trim()) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}

export function assertValidState(state: string | undefined | null): string | undefined {
  if (!state || !state.trim()) {
    return undefined;
  }
  const normalized = state.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error('US State Code must be a two-letter state code such as OH, TX, or FL.');
  }
  return normalized;
}

export function assertValidRecordId(recordId: string): string {
  const cleaned = recordId.trim();
  if (!SAFE_RECORD_ID_RE.test(cleaned)) {
    throw new Error('Record ID must be a valid Dealport company UUID or 10-digit NYC BBL.');
  }
  return cleaned;
}

export function assertValidCompanyUuid(companyId: string): string {
  const cleaned = companyId.trim();
  if (!UUID_RE.test(cleaned)) {
    throw new Error('Company ID must be a valid Dealport company UUID.');
  }
  return cleaned;
}

export function assertDealportUrl(rawUrl: unknown): void {
  if (typeof rawUrl !== 'string') {
    return;
  }
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed) && !`${trimmed}/`.startsWith(`${DEALPORT_BASE_URL}/`)) {
    throw new Error(
      `Custom API Call only accepts paths relative to ${DEALPORT_BASE_URL} so your API key is never sent to another host.`
    );
  }
}

export function statusOfError(error: unknown): number | undefined {
  if (error instanceof HttpError) {
    return error.response.status;
  }
  return undefined;
}

export async function dealportRequest<T = unknown>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  body?: Record<string, unknown>;
}): Promise<T> {
  const cleanQuery: QueryParams = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanQuery[key] = String(value);
      }
    }
  }

  let cleanBody: Record<string, unknown> | undefined;
  if (body) {
    cleanBody = {};
    for (const [key, value] of Object.entries(body)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        cleanBody[key] = value;
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${DEALPORT_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      Accept: 'application/json',
      ...(cleanBody ? { 'Content-Type': 'application/json' } : {}),
    },
    queryParams: Object.keys(cleanQuery).length > 0 ? cleanQuery : undefined,
    body: cleanBody,
  });

  return response.body;
}
