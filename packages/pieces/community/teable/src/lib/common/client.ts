import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import mime from 'mime-types';
import { TeableAuthValue, teableAuthUtil } from '../auth';
import { TEABLE_MAX_PAGE_SIZE } from './constants';

function buildQueryString(query: TeableQuery | undefined): string {
  if (query === undefined) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(`${key}[]`, item);
      }
      continue;
    }
    params.append(key, String(value));
  }
  const text = params.toString();
  return text.length > 0 ? `?${text}` : '';
}

async function makeRequest<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: MakeRequestParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${teableAuthUtil.getBaseUrl(auth)}/api${path}${buildQueryString(query)}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: teableAuthUtil.getToken(auth),
    },
    headers,
    body,
  });
  return response.body;
}

function errorStatus(error: unknown): number | undefined {
  return error instanceof HttpError ? error.response.status : undefined;
}

async function listBases({ auth }: { auth: TeableAuthValue }): Promise<TeableBase[]> {
  return makeRequest<TeableBase[]>({
    auth,
    method: HttpMethod.GET,
    path: '/base/access/all',
  });
}

async function listTables({
  auth,
  baseId,
}: {
  auth: TeableAuthValue;
  baseId: string;
}): Promise<TeableTable[]> {
  return makeRequest<TeableTable[]>({
    auth,
    method: HttpMethod.GET,
    path: `/base/${encodeURIComponent(baseId)}/table`,
  });
}

async function listFields({
  auth,
  tableId,
}: {
  auth: TeableAuthValue;
  tableId: string;
}): Promise<TeableField[]> {
  return makeRequest<TeableField[]>({
    auth,
    method: HttpMethod.GET,
    path: `/table/${encodeURIComponent(tableId)}/field`,
  });
}

async function listViews({
  auth,
  tableId,
}: {
  auth: TeableAuthValue;
  tableId: string;
}): Promise<TeableView[]> {
  return makeRequest<TeableView[]>({
    auth,
    method: HttpMethod.GET,
    path: `/table/${encodeURIComponent(tableId)}/view`,
  });
}

async function getRecord({
  auth,
  tableId,
  recordId,
  query,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordId: string;
  query?: TeableQuery;
}): Promise<TeableRecord> {
  return makeRequest<TeableRecord>({
    auth,
    method: HttpMethod.GET,
    path: `/table/${encodeURIComponent(tableId)}/record/${encodeURIComponent(recordId)}`,
    query,
  });
}

async function listRecords({
  auth,
  tableId,
  query,
}: {
  auth: TeableAuthValue;
  tableId: string;
  query?: TeableQuery;
}): Promise<TeableRecordListResponse> {
  return makeRequest<TeableRecordListResponse>({
    auth,
    method: HttpMethod.GET,
    path: `/table/${encodeURIComponent(tableId)}/record`,
    query,
  });
}

async function listRecordsPaged({
  auth,
  tableId,
  query,
  maxRecords,
  skip,
}: {
  auth: TeableAuthValue;
  tableId: string;
  query?: TeableQuery;
  maxRecords: number;
  skip?: number;
}): Promise<{ records: TeableRecord[]; hasMore: boolean }> {
  const records: TeableRecord[] = [];
  let offset = skip ?? 0;
  let hasMore = false;
  while (records.length < maxRecords) {
    const take = Math.min(TEABLE_MAX_PAGE_SIZE, maxRecords - records.length);
    const page = await listRecords({
      auth,
      tableId,
      query: { ...query, take, skip: offset },
    });
    records.push(...page.records);
    if (page.records.length < take) {
      return { records, hasMore: false };
    }
    offset += page.records.length;
    hasMore = true;
  }
  const lookahead = await listRecords({
    auth,
    tableId,
    query: { ...query, take: 1, skip: offset },
  });
  return { records, hasMore: hasMore && lookahead.records.length > 0 };
}

async function createRecords({
  auth,
  tableId,
  records,
  fieldKeyType,
  typecast,
}: {
  auth: TeableAuthValue;
  tableId: string;
  records: { fields: Record<string, unknown> }[];
  fieldKeyType?: TeableFieldKeyType;
  typecast?: boolean;
}): Promise<{ records: TeableRecord[] }> {
  return makeRequest<{ records: TeableRecord[] }>({
    auth,
    method: HttpMethod.POST,
    path: `/table/${encodeURIComponent(tableId)}/record`,
    body: {
      records,
      ...(fieldKeyType !== undefined ? { fieldKeyType } : {}),
      ...(typecast !== undefined ? { typecast } : {}),
    },
  });
}

async function updateRecord({
  auth,
  tableId,
  recordId,
  fields,
  fieldKeyType,
  typecast,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordId: string;
  fields: Record<string, unknown>;
  fieldKeyType?: TeableFieldKeyType;
  typecast?: boolean;
}): Promise<TeableRecord> {
  return makeRequest<TeableRecord>({
    auth,
    method: HttpMethod.PATCH,
    path: `/table/${encodeURIComponent(tableId)}/record/${encodeURIComponent(recordId)}`,
    body: {
      record: { fields },
      ...(fieldKeyType !== undefined ? { fieldKeyType } : {}),
      ...(typecast !== undefined ? { typecast } : {}),
    },
  });
}

async function updateRecords({
  auth,
  tableId,
  records,
  fieldKeyType,
  typecast,
}: {
  auth: TeableAuthValue;
  tableId: string;
  records: { id: string; fields: Record<string, unknown> }[];
  fieldKeyType?: TeableFieldKeyType;
  typecast?: boolean;
}): Promise<TeableRecord[]> {
  return makeRequest<TeableRecord[]>({
    auth,
    method: HttpMethod.PATCH,
    path: `/table/${encodeURIComponent(tableId)}/record`,
    body: {
      records,
      ...(fieldKeyType !== undefined ? { fieldKeyType } : {}),
      ...(typecast !== undefined ? { typecast } : {}),
    },
  });
}

async function deleteRecord({
  auth,
  tableId,
  recordId,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordId: string;
}): Promise<void> {
  try {
    await makeRequest<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/table/${encodeURIComponent(tableId)}/record/${encodeURIComponent(recordId)}`,
    });
  } catch (error) {
    if (errorStatus(error) === 404) {
      throw new Error(
        `Record ${recordId} was not found in table ${tableId}. It may already be deleted.`
      );
    }
    throw error;
  }
}

async function deleteRecords({
  auth,
  tableId,
  recordIds,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordIds: string[];
}): Promise<void> {
  await makeRequest<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/table/${encodeURIComponent(tableId)}/record`,
    query: { recordIds },
  });
}

async function createTable({
  auth,
  baseId,
  body,
}: {
  auth: TeableAuthValue;
  baseId: string;
  body: Record<string, unknown>;
}): Promise<TeableTable & { fields?: TeableField[]; views?: TeableView[] }> {
  return makeRequest({
    auth,
    method: HttpMethod.POST,
    path: `/base/${encodeURIComponent(baseId)}/table/`,
    body,
  });
}

async function createField({
  auth,
  tableId,
  body,
}: {
  auth: TeableAuthValue;
  tableId: string;
  body: Record<string, unknown>;
}): Promise<TeableField> {
  return makeRequest<TeableField>({
    auth,
    method: HttpMethod.POST,
    path: `/table/${encodeURIComponent(tableId)}/field`,
    body,
  });
}

async function createComment({
  auth,
  tableId,
  recordId,
  content,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordId: string;
  content: unknown[];
}): Promise<unknown> {
  return makeRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/comment/${encodeURIComponent(tableId)}/${encodeURIComponent(recordId)}/create`,
    body: { content },
  });
}

async function getRowCount({
  auth,
  tableId,
}: {
  auth: TeableAuthValue;
  tableId: string;
}): Promise<number> {
  const response = await makeRequest<{ rowCount: number }>({
    auth,
    method: HttpMethod.GET,
    path: `/table/${encodeURIComponent(tableId)}/aggregation/row-count`,
  });
  return response.rowCount;
}

async function uploadAttachment({
  auth,
  tableId,
  recordId,
  fieldId,
  filename,
  extension,
  data,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordId: string;
  fieldId: string;
  filename: string;
  extension?: string;
  data: Buffer;
}): Promise<TeableRecord> {
  const lookedUp = extension !== undefined ? mime.lookup(extension) : false;
  const contentType = lookedUp === false ? 'application/octet-stream' : lookedUp;
  const form = new FormData();
  form.append('file', data, { filename, contentType });
  const path = `/table/${encodeURIComponent(tableId)}/record/${encodeURIComponent(
    recordId
  )}/${encodeURIComponent(fieldId)}/uploadAttachment`;
  const response = await httpClient.sendRequest<TeableRecord>({
    method: HttpMethod.POST,
    url: `${teableAuthUtil.getBaseUrl(auth)}/api${path}`,
    headers: form.getHeaders(),
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: teableAuthUtil.getToken(auth),
    },
    body: form,
  });
  return response.body;
}

export const teableClient = {
  buildQueryString,
  makeRequest,
  errorStatus,
  listBases,
  listTables,
  listFields,
  listViews,
  getRecord,
  listRecords,
  listRecordsPaged,
  createRecords,
  updateRecord,
  updateRecords,
  deleteRecord,
  deleteRecords,
  createTable,
  createField,
  createComment,
  getRowCount,
  uploadAttachment,
};

export type TeableQuery = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export type TeableFieldKeyType = 'id' | 'name' | 'dbFieldName';

export type MakeRequestParams = {
  auth: TeableAuthValue;
  method: HttpMethod;
  path: string;
  query?: TeableQuery;
  body?: unknown;
  headers?: Record<string, string>;
};

export type TeableBase = {
  id: string;
  name: string;
  spaceId: string;
  icon: string | null;
  role: string;
};

export type TeableTable = {
  id: string;
  name: string;
  dbTableName?: string;
  description?: string;
  icon?: string;
  order?: number;
  defaultViewId?: string;
};

export type TeableField = {
  id: string;
  name: string;
  type: string;
  description?: string;
  isComputed?: boolean;
  isPrimary?: boolean;
  notNull?: boolean;
  unique?: boolean;
  dbFieldName?: string;
  options?: {
    choices?: { id: string; name: string; color?: string }[];
    [key: string]: unknown;
  };
};

export type TeableView = {
  id: string;
  name: string;
  type: string;
  order?: number;
};

export type TeableRecord = {
  id: string;
  fields: Record<string, unknown>;
  name?: string;
  autoNumber?: number;
  createdTime?: string;
  lastModifiedTime?: string;
  createdBy?: string;
  lastModifiedBy?: string;
};

export type TeableRecordListResponse = {
  records: TeableRecord[];
  extra?: {
    nextCursor?: string | null;
  };
};
