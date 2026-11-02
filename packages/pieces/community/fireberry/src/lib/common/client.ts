import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';

const FIREBERRY_API_BASE_URL = 'https://api.fireberry.com';
const MAX_ATTEMPTS = 3; // 1 try + one retry per RETRY_DELAYS_MS entry
// Fixed backoff for retried reads (429/5xx): wait 2s, then 4s. The shared httpClient's HttpError
// only carries status and body, so a Retry-After header is not readable on the error path and is not used.
const RETRY_DELAYS_MS = [2000, 4000];
const REQUEST_TIMEOUT_MS = 30000;
const MAX_PAGE_SIZE = 50;
const MAX_PAGE_NUMBER = 10;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function extractVendorMessage(body: unknown): string | undefined {
  const parsed = parseBody(body);
  if (typeof parsed === 'string' && parsed.trim().length > 0) {
    return parsed;
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  for (const key of ['Message', 'message', 'error_description']) {
    const value = parsed[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  const error = parsed['error'];
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (isRecord(error) && typeof error['message'] === 'string') {
    return error['message'];
  }
  return undefined;
}

function retryDelayMs(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length) - 1];
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], body: response['body'] };
}

function errorMessage(error: unknown): string {
  if (isRecord(error) && typeof error['message'] === 'string') {
    return error['message'];
  }
  return String(error);
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function buildError({ status, body }: { status: number; body: unknown }): FireberryApiError {
  const vendorMessage = extractVendorMessage(body);
  const text = (vendorMessage ?? JSON.stringify(parseBody(body) ?? null)).trim().replace(/[\s.!?;:,]+$/, '');
  const message = status === 429
    ? `Fireberry rate limit reached (429): ${text}. Fireberry limits API calls per token; wait a few minutes before retrying.`
    : `Fireberry API error (${status}): ${text}`;
  return new FireberryApiError({
    message,
    status,
    responseBody: parseBody(body),
  });
}

function assertSuccess<T>(body: T): T {
  if (isRecord(body) && body['success'] === false) {
    throw buildError({ status: 200, body });
  }
  return body;
}

function extractId({ record, objectSystemName }: { record: Record<string, unknown>; objectSystemName: string }): string | undefined {
  const candidates = [`${objectSystemName.toLowerCase()}id`, 'id'];
  for (const key of Object.keys(record)) {
    if (candidates.includes(key.toLowerCase())) {
      const value = record[key];
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }
    }
  }
  return undefined;
}

function firstBatchRecord(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    return {};
  }
  const data = body['data'];
  if (Array.isArray(data)) {
    const first: unknown = data[0];
    return isRecord(first) ? first : {};
  }
  if (isRecord(data)) {
    const single = data['Record'] ?? data['record'];
    if (isRecord(single)) {
      return single;
    }
    const records = data['Records'] ?? data['records'];
    if (Array.isArray(records)) {
      const first: unknown = records[0];
      return isRecord(first) ? first : {};
    }
    return data;
  }
  return {};
}

function parseFieldsObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === 'string' ? parseJsonObject(value) : value;
  if (!isRecord(parsed)) {
    throw new Error('Fields must be a JSON object mapping field system names to values, for example {"accountname": "Acme"}.');
  }
  return parsed;
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Fields must be valid JSON, for example {"accountname": "Acme"}.');
  }
}

function toRecordResult({ body, objectSystemName, fallbackId }: { body: unknown; objectSystemName: string; fallbackId?: string }) {
  const record = firstBatchRecord(body);
  return {
    id: extractId({ record, objectSystemName }) ?? fallbackId ?? null,
    objectSystemName,
    record,
  };
}

function buildQueryBody({
  objectType,
  fields,
  query,
  sortBy,
  sortType,
  pageSize,
  pageNumber,
}: {
  objectType: number;
  fields?: string[];
  query?: string;
  sortBy?: string;
  sortType?: string;
  pageSize?: number;
  pageNumber?: number;
}): FireberryQueryBody {
  const body: FireberryQueryBody = { objecttype: objectType };
  const cleanFields = (fields ?? []).map((field) => field.trim()).filter((field) => field.length > 0);
  if (cleanFields.length > 0) {
    body.fields = cleanFields.join(',');
  }
  const cleanQuery = query?.trim();
  if (cleanQuery) {
    body.query = cleanQuery;
  }
  const cleanSortBy = sortBy?.trim();
  if (cleanSortBy) {
    body.sort_by = cleanSortBy;
    body.sort_type = sortType === 'asc' ? 'asc' : 'desc';
  }
  if (pageSize !== undefined && pageSize !== null) {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new Error(`Page size must be a whole number between 1 and ${MAX_PAGE_SIZE}.`);
    }
    body.page_size = pageSize;
  }
  if (pageNumber !== undefined && pageNumber !== null) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > MAX_PAGE_NUMBER) {
      throw new Error(`Page number must be a whole number between 1 and ${MAX_PAGE_NUMBER}. Fireberry only serves the first ${MAX_PAGE_NUMBER} pages of a query; narrow the query to reach older records.`);
    }
    body.page_number = pageNumber;
  }
  return body;
}

export class FireberryClient {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request<T = unknown>({
    method,
    resourceUri,
    body,
    queryParams,
    retry,
  }: {
    method: HttpMethod;
    resourceUri: string;
    body?: unknown;
    queryParams?: Record<string, string>;
    retry?: boolean;
  }): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${FIREBERRY_API_BASE_URL}${resourceUri}`,
      headers: {
        tokenid: this.token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
      timeout: REQUEST_TIMEOUT_MS,
    };
    const canRetry = retry ?? method === HttpMethod.GET;
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await httpClient.sendRequest<T>(request);
        if (response.status >= 200 && response.status < 300) {
          return assertSuccess(response.body);
        }
        if (canRetry && shouldRetry(response.status) && attempt < MAX_ATTEMPTS) {
          await delay(retryDelayMs(attempt));
          continue;
        }
        throw buildError({ status: response.status, body: response.body });
      } catch (error) {
        const failure = readHttpFailure(error);
        if (!failure) {
          throw error;
        }
        if (canRetry && shouldRetry(failure.status) && attempt < MAX_ATTEMPTS) {
          await delay(retryDelayMs(attempt));
          continue;
        }
        throw buildError(failure);
      }
    }
  }

  async getObjectsMetadata(): Promise<FireberryObjectMetadata[]> {
    const response = await this.request<{ data?: FireberryObjectMetadata[] }>({
      method: HttpMethod.GET,
      resourceUri: '/metadata/records',
    });
    return response.data ?? [];
  }

  async getObjectFieldsMetadata(objectSystemName: string): Promise<FireberryFieldMetadata[]> {
    const response = await this.request<{ data?: FireberryFieldMetadata[] }>({
      method: HttpMethod.GET,
      resourceUri: `/metadata/records/${encodeURIComponent(objectSystemName)}/fields`,
    });
    return response.data ?? [];
  }

  async getPicklistValues({ objectSystemName, fieldName }: { objectSystemName: string; fieldName: string }): Promise<FireberryPicklistValue[]> {
    const response = await this.request<{ data?: { values?: FireberryPicklistValue[] } }>({
      method: HttpMethod.GET,
      resourceUri: `/metadata/records/${encodeURIComponent(objectSystemName)}/fields/${encodeURIComponent(fieldName)}/values`,
    });
    return response.data?.values ?? [];
  }

  async resolveObject(objectTypeInput: string): Promise<{ systemName: string; objectType: number }> {
    const input = objectTypeInput.trim();
    const objects = await this.getObjectsMetadata();
    const target = objects.find(
      (obj) => obj.systemName.toLowerCase() === input.toLowerCase() || String(obj.objectType) === input,
    );
    if (!target) {
      throw new Error(`Fireberry object type '${input}' was not found. Use a systemName (e.g. Account) or numeric objectType (e.g. 1) returned by List Object Types.`);
    }
    const objectType = Number(target.objectType);
    if (!Number.isInteger(objectType)) {
      throw new Error(`Fireberry object type '${input}' has no numeric objectType.`);
    }
    return { systemName: target.systemName, objectType };
  }

  async resolveObjectTypeNumber(objectTypeInput: string): Promise<number> {
    return (await this.resolveObject(objectTypeInput)).objectType;
  }

  async query(body: FireberryQueryBody): Promise<FireberryQueryResult> {
    const response = await this.request<{ data?: Partial<FireberryQueryResult> }>({
      method: HttpMethod.POST,
      resourceUri: '/api/query',
      body,
      retry: true,
    });
    const data = response.data ?? {};
    return {
      ObjectName: data.ObjectName ?? '',
      SystemName: data.SystemName ?? '',
      ObjectType: data.ObjectType ?? body.objecttype,
      PrimaryKey: data.PrimaryKey ?? '',
      PrimaryField: data.PrimaryField ?? '',
      PageNum: data.PageNum ?? body.page_number ?? 1,
      SortBy: data.SortBy ?? '',
      SortBy_Desc: data.SortBy_Desc ?? false,
      IsLastPage: data.IsLastPage ?? true,
      Columns: data.Columns ?? [],
      Data: data.Data ?? [],
    };
  }

  async listRecords({ objectSystemName, top }: { objectSystemName: string; top: number }): Promise<FireberryRecordList> {
    const response = await this.request<{ data?: Partial<FireberryRecordList> }>({
      method: HttpMethod.GET,
      resourceUri: `/api/record/${encodeURIComponent(objectSystemName)}`,
      queryParams: { $top: String(top) },
    });
    return {
      Records: response.data?.Records ?? [],
      PrimaryField: response.data?.PrimaryField ?? '',
      PrimaryKey: response.data?.PrimaryKey ?? '',
    };
  }

  async getRecord({ objectSystemName, recordId }: { objectSystemName: string; recordId: string }): Promise<Record<string, unknown>> {
    const response = await this.request<unknown>({
      method: HttpMethod.GET,
      resourceUri: `/api/record/${encodeURIComponent(objectSystemName)}/${encodeURIComponent(recordId)}`,
    }).catch((error: unknown) => {
      const status = isRecord(error) ? error['status'] : undefined;
      if (status === 400) {
        throw new FireberryApiError({
          message: `Fireberry record '${recordId}' of type '${objectSystemName}' was not found or has been deleted. ${errorMessage(error)}`,
          status,
          responseBody: isRecord(error) ? error['responseBody'] : undefined,
        });
      }
      throw error;
    });
    if (isRecord(response) && isRecord(response['data'])) {
      const data = response['data'];
      const nested = data['Record'] ?? data['record'];
      return isRecord(nested) ? nested : data;
    }
    return {};
  }

  async createRecord({ objectSystemName, record }: { objectSystemName: string; record: Record<string, unknown> }): Promise<unknown> {
    return this.request({
      method: HttpMethod.POST,
      resourceUri: `/api/record/${encodeURIComponent(objectSystemName)}`,
      body: record,
      retry: false,
    });
  }

  async updateRecord({ objectSystemName, recordId, record }: { objectSystemName: string; recordId: string; record: Record<string, unknown> }): Promise<unknown> {
    return this.request({
      method: HttpMethod.PUT,
      resourceUri: `/api/record/${encodeURIComponent(objectSystemName)}/${encodeURIComponent(recordId)}`,
      body: record,
      retry: true,
    });
  }

  async deleteRecord({ objectSystemName, recordId }: { objectSystemName: string; recordId: string }): Promise<unknown> {
    return this.request({
      method: HttpMethod.DELETE,
      resourceUri: `/api/record/${encodeURIComponent(objectSystemName)}/${encodeURIComponent(recordId)}`,
      retry: false,
    });
  }
}

export class FireberryApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'FireberryApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const fireberryUtils = {
  isRecord,
  extractId,
  firstBatchRecord,
  extractVendorMessage,
  errorMessage,
  parseFieldsObject,
  toRecordResult,
  buildQueryBody,
};

export const FIREBERRY_LIMITS = { MAX_PAGE_SIZE, MAX_PAGE_NUMBER };

export type FireberryObjectMetadata = {
  name: string;
  systemName: string;
  objectType: string | number;
};

export type FireberryFieldMetadata = {
  label: string;
  fieldName: string;
  systemFieldTypeId: string;
  systemName?: string;
};

export type FireberryPicklistValue = {
  name: string;
  value: string;
};

export type FireberryQueryBody = {
  objecttype: number;
  fields?: string;
  query?: string;
  sort_by?: string;
  sort_type?: 'asc' | 'desc';
  page_size?: number;
  page_number?: number;
};

export type FireberryQueryResult = {
  ObjectName: string;
  SystemName: string;
  ObjectType: number;
  PrimaryKey: string;
  PrimaryField: string;
  PageNum: number;
  SortBy: string;
  SortBy_Desc: boolean;
  IsLastPage: boolean;
  Columns: Record<string, unknown>[];
  Data: Record<string, unknown>[];
};

export type FireberryRecordList = {
  Records: Record<string, unknown>[];
  PrimaryField: string;
  PrimaryKey: string;
};

