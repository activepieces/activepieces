import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

async function bokioRequest<T>({
  auth,
  method,
  path,
  body,
  queryParams,
  operation,
}: BokioRequestParams): Promise<T> {
  const companyId = auth.companyId.trim();
  if (companyId.length === 0) {
    throw new Error('Bokio connection is missing the Company ID.');
  }
  const cleanQuery: Record<string, string> = {};
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value !== undefined && value !== '') {
      cleanQuery[key] = value;
    }
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}/companies/${encodeURIComponent(companyId)}${path}`,
      headers: {
        Authorization: `Bearer ${auth.api_key.trim()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      queryParams: cleanQuery,
      body,
    });
    return response.body;
  } catch (error) {
    throw toBokioError({ error, operation, method });
  }
}

function toBokioError({
  error,
  operation,
  method,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
}): BokioError {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const apiError = extractApiError(error.response.body);
    const parts: string[] = [];
    if (apiError.message) {
      parts.push(apiError.message);
    }
    for (const fieldError of apiError.errors) {
      parts.push(
        fieldError.field
          ? `${fieldError.field}: ${fieldError.message}`
          : fieldError.message
      );
    }
    const detail = parts.length > 0 ? parts.join('; ') : describeStatus(status);
    return new BokioError({
      message: `Bokio ${operation} failed (HTTP ${status}${
        apiError.code ? `, ${apiError.code}` : ''
      }): ${detail}`,
      httpStatus: status,
      responseBody: error.response.body,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const mayHaveApplied =
    method === HttpMethod.GET
      ? ''
      : ' The request may still have been applied in Bokio; check before retrying.';
  return new BokioError({
    message: `Bokio ${operation} did not complete (network error: ${reason}).${mayHaveApplied}`,
    httpStatus: 0,
    responseBody: null,
  });
}

function extractApiError(body: unknown): ParsedApiError {
  const source = isRecord(body) && isRecord(body['apiError']) ? body['apiError'] : body;
  if (!isRecord(source)) {
    return {
      code: undefined,
      message: typeof body === 'string' && body.length > 0 ? body : undefined,
      errors: [],
    };
  }
  const errors: { field: string | undefined; message: string }[] = [];
  const rawErrors = source['errors'];
  if (Array.isArray(rawErrors)) {
    for (const entry of rawErrors) {
      if (isRecord(entry) && typeof entry['message'] === 'string') {
        errors.push({
          field: typeof entry['field'] === 'string' ? entry['field'] : undefined,
          message: entry['message'],
        });
      }
    }
  }
  return {
    code: typeof source['code'] === 'string' ? source['code'] : undefined,
    message: typeof source['message'] === 'string' ? source['message'] : undefined,
    errors,
  };
}

function describeStatus(status: number): string {
  if (status === 401) {
    return 'the API key is invalid or expired.';
  }
  if (status === 403) {
    return 'access denied or quota exceeded.';
  }
  if (status === 404) {
    return 'not found.';
  }
  if (status === 429) {
    return 'rate limit exceeded; try again later.';
  }
  return 'unexpected response.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampPageSize(pageSize: unknown): string | undefined {
  const parsed = toOptionalNumber(pageSize);
  if (parsed === undefined) {
    return undefined;
  }
  return String(Math.min(100, Math.max(1, Math.floor(parsed))));
}

function clampPage(page: unknown): string | undefined {
  const parsed = toOptionalNumber(page);
  if (parsed === undefined) {
    return undefined;
  }
  return String(Math.max(1, Math.floor(parsed)));
}

function listParams({
  page,
  pageSize,
  query,
}: {
  page: unknown;
  pageSize: unknown;
  query?: string;
}): Record<string, string> {
  const params: Record<string, string> = {};
  const pageValue = clampPage(page);
  const pageSizeValue = clampPageSize(pageSize);
  if (pageValue) {
    params['page'] = pageValue;
  }
  if (pageSizeValue) {
    params['pageSize'] = pageSizeValue;
  }
  if (query) {
    params['query'] = query;
  }
  return params;
}

function buildFilter(conditions: FilterCondition[]): string {
  const parts: string[] = [];
  for (const condition of conditions) {
    if (condition.value === undefined || condition.value === '') {
      continue;
    }
    const value = condition.value.trim();
    if (value.includes('&&') || value.includes('||')) {
      throw new Error(
        `Bokio filter value for "${condition.field}" cannot contain "&&" or "||".`
      );
    }
    parts.push(`${condition.field}${condition.operator}${value}`);
  }
  return parts.join('&&');
}

function normalizePage<T>(body: unknown): BokioPage<T> {
  if (Array.isArray(body)) {
    return { items: body, totalItems: body.length, totalPages: 1, currentPage: 1 };
  }
  if (!isRecord(body)) {
    return { items: [], totalItems: 0, totalPages: 0, currentPage: 1 };
  }
  const rawItems = Array.isArray(body['items'])
    ? body['items']
    : Array.isArray(body['result'])
    ? body['result']
    : [];
  return {
    items: rawItems,
    totalItems: toOptionalNumber(body['totalItems']) ?? rawItems.length,
    totalPages: toOptionalNumber(body['totalPages']) ?? 1,
    currentPage: toOptionalNumber(body['currentPage']) ?? 1,
  };
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

class BokioError extends Error {
  readonly httpStatus: number;
  readonly responseBody: unknown;

  constructor({
    message,
    httpStatus,
    responseBody,
  }: {
    message: string;
    httpStatus: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'BokioError';
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }
}

type ParsedApiError = {
  code: string | undefined;
  message: string | undefined;
  errors: { field: string | undefined; message: string }[];
};

export const BASE_URL = 'https://api.bokio.se/v1';

export const bokioClient = {
  request: bokioRequest,
  listParams,
  buildFilter,
  normalizePage,
  toOptionalNumber,
  isRecord,
};

export { BokioError };

export type BokioAuthProps = {
  companyId: string;
  api_key: string;
};

export type BokioRequestParams = {
  auth: BokioAuthProps;
  method: HttpMethod;
  path: string;
  operation: string;
  body?: unknown;
  queryParams?: Record<string, string | undefined>;
};

export type FilterCondition = {
  field: string;
  operator: '==' | '!=' | '>=' | '<=' | '>' | '<' | '~';
  value: string | undefined;
};

export type BokioPage<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
};
