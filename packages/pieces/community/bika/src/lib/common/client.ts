import { randomBytes } from 'crypto';
import { AuthenticationType, httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const BIKA_API_BASE = 'https://bika.ai/api/openapi/bika';

const REQUEST_TIMEOUT_MS = 60_000;
const RATE_LIMIT_WAIT_MS = 1_500;
const MAX_ERROR_TEXT = 500;
const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  zip: 'application/zip',
};

export class BikaApiError extends Error {
  readonly status: number;
  readonly code: number | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    const code = isRecord(responseBody) && typeof responseBody['code'] === 'number' ? responseBody['code'] : undefined;
    super(`Bika could not ${operation} (HTTP ${status}${code !== undefined && code !== status ? `, code ${code}` : ''}): ${describe({ status, responseBody })}`);
    this.name = 'BikaApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.trim().length > 0) {
    return responseBody.trim().slice(0, MAX_ERROR_TEXT);
  }
  if (isRecord(responseBody)) {
    const message = responseBody['message'];
    if (typeof message === 'string' && message.length > 0) {
      return message.slice(0, MAX_ERROR_TEXT);
    }
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function isQuotaMessage(text: string): boolean {
  return /quota|API_REQUEST|usage limit|exceed/i.test(text);
}

function describe({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  if (isQuotaMessage(detail)) {
    return `the Bika space has reached its monthly API request quota (the Free plan allows 100 requests a month). Upgrade the space plan or wait for the next month. ${detail}`;
  }
  if (status !== 404 && /not found/i.test(detail)) {
    return `not found. Check the space, database and record IDs. ${detail}`;
  }
  switch (status) {
    case 401:
      return `the API token is invalid or was revoked. Create a new token in Bika (My Settings > Developer) and reconnect. ${detail}`;
    case 403:
      return `the token's user has no access to this space, database or record. ${detail}`;
    case 404:
      return `not found. Check the space, database and record IDs. ${detail}`;
    case 429:
      return `Bika rate limit reached (the Free plan allows 2 requests per second); try again in a minute. ${detail}`;
    default:
      return detail;
  }
}

function statusOf(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function seg({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${label} is required.`);
  }
  const text = String(value).trim();
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error(`${label} "${text.slice(0, 100)}" is not a valid Bika ID. Use the ID only (letters and digits, for example rec... or dat...).`);
  }
  return text;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request({
  token,
  method,
  path,
  queryParams,
  body,
  contentType,
  operation,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
  contentType?: string;
  operation: string;
}): Promise<BikaEnvelope> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<unknown>({
        method,
        url: `${BIKA_API_BASE}${path}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: token.trim() },
        headers: contentType === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': contentType },
        queryParams,
        body,
        timeout: REQUEST_TIMEOUT_MS,
      });
      return unwrap({ operation, status: response.status, responseBody: response.body });
    } catch (error) {
      if (error instanceof BikaApiError) {
        throw error;
      }
      const status = statusOf(error);
      if (status === undefined) {
        throw error;
      }
      const responseBody = responseBodyOf(error);
      if (status === 429 && attempt === 0 && !isQuotaMessage(vendorMessage(responseBody))) {
        await wait(RATE_LIMIT_WAIT_MS);
        continue;
      }
      throw new BikaApiError({ operation, status, responseBody });
    }
  }
}

function unwrap({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }): BikaEnvelope {
  if (!isRecord(responseBody) || responseBody['success'] !== true) {
    throw new BikaApiError({ operation, status: isRecord(responseBody) && typeof responseBody['code'] === 'number' ? responseBody['code'] : status, responseBody });
  }
  return {
    success: true,
    code: typeof responseBody['code'] === 'number' ? responseBody['code'] : status,
    message: typeof responseBody['message'] === 'string' ? responseBody['message'] : '',
    data: responseBody['data'],
  };
}

function databasePath({ spaceId, databaseId }: { spaceId: unknown; databaseId: unknown }): string {
  return `/v2/spaces/${seg({ value: spaceId, label: 'Space ID' })}/resources/databases/${seg({ value: databaseId, label: 'Database ID' })}/records`;
}

async function listSpaces({ token }: { token: string }) {
  return request({ token, method: HttpMethod.GET, path: '/v1/spaces', operation: 'list spaces' });
}

async function listNodes({ token, spaceId }: { token: string; spaceId: unknown }) {
  return request({
    token,
    method: HttpMethod.GET,
    path: `/v1/spaces/${seg({ value: spaceId, label: 'Space ID' })}/nodes`,
    operation: 'list the space resources',
  });
}

async function listDatabases({ token, spaceId }: { token: string; spaceId: unknown }): Promise<BikaNode[]> {
  const response = await listNodes({ token, spaceId });
  return toNodes(response.data).filter((node) => node.type === 'DATABASE');
}

async function getFields({ token, spaceId, databaseId }: { token: string; spaceId: unknown; databaseId: unknown }) {
  return request({
    token,
    method: HttpMethod.GET,
    path: `/v1/spaces/${seg({ value: spaceId, label: 'Space ID' })}/resources/databases/${seg({ value: databaseId, label: 'Database ID' })}/fields`,
    operation: 'read the database fields',
  });
}

async function listRecordsPage({
  token,
  spaceId,
  databaseId,
  query,
}: {
  token: string;
  spaceId: unknown;
  databaseId: unknown;
  query: QueryParams;
}) {
  return request({
    token,
    method: HttpMethod.GET,
    path: databasePath({ spaceId, databaseId }),
    queryParams: query,
    operation: 'list records',
  });
}

async function getRecord({ token, spaceId, databaseId, recordId }: { token: string; spaceId: unknown; databaseId: unknown; recordId: unknown }) {
  return request({
    token,
    method: HttpMethod.GET,
    path: `${databasePath({ spaceId, databaseId })}/${seg({ value: recordId, label: 'Record ID' })}`,
    operation: 'get the record',
  });
}

async function createRecord({ token, spaceId, databaseId, fields }: { token: string; spaceId: unknown; databaseId: unknown; fields: Record<string, unknown> }) {
  return request({
    token,
    method: HttpMethod.POST,
    path: databasePath({ spaceId, databaseId }),
    body: { fieldKey: 'name', records: [{ fields }] },
    operation: 'create the record',
  });
}

async function updateRecord({
  token,
  spaceId,
  databaseId,
  recordId,
  fields,
}: {
  token: string;
  spaceId: unknown;
  databaseId: unknown;
  recordId: unknown;
  fields: Record<string, unknown>;
}) {
  return request({
    token,
    method: HttpMethod.PUT,
    path: `${databasePath({ spaceId, databaseId })}/${seg({ value: recordId, label: 'Record ID' })}`,
    body: { fieldKey: 'name', fields },
    operation: 'update the record',
  });
}

async function deleteRecord({ token, spaceId, databaseId, recordId }: { token: string; spaceId: unknown; databaseId: unknown; recordId: unknown }) {
  return request({
    token,
    method: HttpMethod.DELETE,
    path: `${databasePath({ spaceId, databaseId })}/${seg({ value: recordId, label: 'Record ID' })}`,
    operation: 'delete the record',
  });
}

async function uploadAttachment({
  token,
  spaceId,
  file,
}: {
  token: string;
  spaceId: unknown;
  file: { filename: string; data: Buffer };
}): Promise<BikaUploadedAttachment> {
  const multipart = multipartBody(file);
  const response = await request({
    token,
    method: HttpMethod.POST,
    path: `/v1/spaces/${seg({ value: spaceId, label: 'Space ID' })}/attachments`,
    body: multipart.body,
    contentType: multipart.contentType,
    operation: `upload the file "${file.filename}"`,
  });
  const first = findAttachment(response.data);
  if (first === undefined) {
    throw new Error(`Bika accepted the file "${file.filename}" but returned no attachment ID: ${JSON.stringify(response.data ?? null).slice(0, MAX_ERROR_TEXT)}`);
  }
  return {
    id: first['id'],
    name: typeof first['name'] === 'string' ? first['name'] : file.filename,
    mimeType: typeof first['mimeType'] === 'string' ? first['mimeType'] : undefined,
    size: typeof first['size'] === 'number' ? first['size'] : undefined,
  };
}

function multipartBody(file: { filename: string; data: Buffer }): { body: Buffer; contentType: string } {
  const boundary = `----ActivepiecesBika${randomBytes(12).toString('hex')}`;
  const safeName = file.filename.replace(/["\r\n\\]/g, '_');
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeName}"\r\nContent-Type: ${mimeType(file.filename)}\r\n\r\n`,
    'utf8',
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  return { body: Buffer.concat([head, file.data, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

function mimeType(filename: string): string {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() ?? '' : '';
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

function findAttachment(data: unknown): Record<string, unknown> & { id: string } | undefined {
  const candidates: unknown[] = [];
  if (Array.isArray(data)) {
    candidates.push(data[0]);
  } else if (isRecord(data)) {
    candidates.push(data);
    for (const key of ['attachment', 'attachments', 'data']) {
      const nested = data[key];
      candidates.push(Array.isArray(nested) ? nested[0] : nested);
    }
  }
  for (const candidate of candidates) {
    if (isRecord(candidate) && typeof candidate['id'] === 'string') {
      return { ...candidate, id: candidate['id'] };
    }
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toSpaces(data: unknown): BikaSpace[] {
  return (Array.isArray(data) ? data : []).filter(isRecord).map((space) => {
    const subscription = isRecord(space['subscription']) ? space['subscription'] : {};
    return {
      id: String(space['id'] ?? ''),
      name: String(space['name'] ?? ''),
      createdAt: text(space['createdAt']),
      memberCount: typeof space['memberCount'] === 'number' ? space['memberCount'] : undefined,
      plan: text(subscription['plan']),
    };
  });
}

function toNodes(data: unknown): BikaNode[] {
  return (Array.isArray(data) ? data : []).filter(isRecord).map((node) => ({
    id: String(node['id'] ?? ''),
    name: String(node['name'] ?? ''),
    type: String(node['type'] ?? ''),
    parentId: text(node['parentId']),
    path: text(node['path']),
  }));
}

function toFields(data: unknown): BikaField[] {
  return (Array.isArray(data) ? data : []).filter(isRecord).map((field) => {
    const property = isRecord(field['property']) ? field['property'] : {};
    const options = Array.isArray(property['options']) ? property['options'].filter(isRecord) : [];
    return {
      id: String(field['id'] ?? ''),
      name: String(field['name'] ?? ''),
      type: String(field['type'] ?? ''),
      description: text(field['description']),
      primary: field['primary'] === true,
      options: options.map((option) => ({ id: text(option['id']), name: String(option['name'] ?? '') })),
    };
  });
}

function toRecord(data: unknown): BikaRecord {
  if (!isRecord(data) || typeof data['id'] !== 'string') {
    throw new Error('Bika returned a record without an ID.');
  }
  return {
    id: data['id'],
    fields: isRecord(data['fields']) ? data['fields'] : {},
    createdAt: text(data['createdAt']),
    updatedAt: text(data['updatedAt']),
  };
}

function toRecordPage(data: unknown): BikaRecordPage {
  const page = isRecord(data) ? data : {};
  const records = Array.isArray(page['records']) ? page['records'] : [];
  const offset = text(page['offset']);
  return {
    records: records.map(toRecord),
    hasMore: page['hasMore'] === true && offset !== undefined && offset.length > 0,
    offset: offset !== undefined && offset.length > 0 ? offset : undefined,
  };
}

function toCreatedRecord(data: unknown): BikaRecord {
  const records = isRecord(data) && Array.isArray(data['records']) ? data['records'] : [];
  return toRecord(records[0]);
}

export const bikaHelpers = { isRecord, seg, wait, isQuotaMessage };

export const bikaParse = { toSpaces, toNodes, toFields, toRecord, toRecordPage, toCreatedRecord };

export const bikaClient = {
  listSpaces,
  listNodes,
  listDatabases,
  getFields,
  listRecordsPage,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  uploadAttachment,
};

export type BikaEnvelope = {
  success: boolean;
  code: number;
  message: string;
  data: unknown;
};

export type BikaSpace = {
  id: string;
  name: string;
  createdAt?: string;
  memberCount?: number;
  plan?: string;
};

export type BikaNode = {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  path?: string;
};

export type BikaField = {
  id: string;
  name: string;
  type: string;
  description?: string;
  primary: boolean;
  options: { id?: string; name: string }[];
};

export type BikaRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type BikaRecordPage = {
  records: BikaRecord[];
  hasMore: boolean;
  offset?: string;
};

export type BikaUploadedAttachment = {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
};
