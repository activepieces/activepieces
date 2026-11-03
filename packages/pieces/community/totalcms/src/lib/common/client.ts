import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { totalcmsBaseUrl } from '../auth';

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;

export class TotalCmsApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Total CMS could not ${operation} (HTTP ${status}): ${describeStatus({ status, responseBody })}`);
    this.name = 'TotalCmsApiError';
    this.status = status;
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
    const error = responseBody['error'];
    if (typeof error === 'string' && error.length > 0) {
      return error.slice(0, MAX_ERROR_TEXT);
    }
    if (isRecord(error) && typeof error['message'] === 'string') {
      return error['message'].replace(/^\d{3} [A-Za-z ]+ - /, '').slice(0, MAX_ERROR_TEXT);
    }
    if (typeof responseBody['message'] === 'string') {
      return responseBody['message'].slice(0, MAX_ERROR_TEXT);
    }
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  switch (status) {
    case 401:
      return `the API key is invalid or was revoked. ${detail}`;
    case 403:
      return `the API key is not allowed to do this. Check the key's allowed methods and endpoints in Total CMS (Utilities > API Keys). ${detail}`;
    case 404:
      return `not found. Check the collection and object ID. ${detail}`;
    case 429:
      return `Total CMS rate limit reached; try again in a minute. ${detail}`;
    default:
      return detail;
  }
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof TotalCmsApiError) {
    return error.status;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function seg({ value, label }: { value: unknown; label: string }): string {
  if (value === undefined || value === null) {
    throw new Error(`${label} is required.`);
  }
  const text = String(value).trim();
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..' || text.includes('/') || text.includes('\\')) {
    throw new Error(`${label} "${text.slice(0, 100)}" is not valid. Use the ID only, without slashes.`);
  }
  return encodeURIComponent(text);
}

function apiBase(auth: TotalCmsConnection): string {
  const base = totalcmsBaseUrl(auth.props.domain);
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error('The connection Site URL is not a valid web address. Reconnect Total CMS with a full URL such as https://www.example.com.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('The connection Site URL must start with http:// or https://.');
  }
  return `${base}/api`;
}

function siteBase(auth: TotalCmsConnection): string {
  return totalcmsBaseUrl(auth.props.domain);
}

async function request<T>({
  auth,
  method,
  path,
  queryParams,
  body,
  operation,
}: {
  auth: TotalCmsConnection;
  method: HttpMethod;
  path: string[];
  queryParams?: QueryParams;
  body?: unknown;
  operation: string;
}): Promise<T> {
  const url = `${apiBase(auth)}/${path.join('/')}`;
  const isForm = body instanceof FormData;
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers: {
        'X-API-Key': auth.props.apiKey.trim(),
        Accept: 'application/json',
        ...(isForm ? body.getHeaders() : {}),
      },
      queryParams,
      body,
      timeout: REQUEST_TIMEOUT_MS,
      followRedirects: false,
    });
    if (response.status >= 300) {
      throw new TotalCmsApiError({
        operation,
        status: response.status,
        responseBody: 'The site answered with a redirect. Use the final site address (for example https:// and the www prefix if your site uses it) as the Site URL.',
      });
    }
    return response.body;
  } catch (error) {
    if (error instanceof TotalCmsApiError) {
      throw error;
    }
    const status = statusOf(error);
    if (status === undefined) {
      throw error;
    }
    throw new TotalCmsApiError({ operation, status, responseBody: responseBodyOf(error) });
  }
}

function unwrap(body: unknown): Record<string, unknown> {
  if (isRecord(body) && isRecord(body['data'])) {
    return body['data'];
  }
  if (isRecord(body)) {
    return body;
  }
  throw new Error('Total CMS returned an unexpected response.');
}

async function listCollections({ auth }: { auth: TotalCmsConnection }): Promise<TotalCmsCollection[]> {
  const body = await request<unknown>({ auth, method: HttpMethod.GET, path: ['collections'], operation: 'list collections' });
  const data = isRecord(body) ? body['data'] : undefined;
  if (!Array.isArray(data)) {
    throw new Error('Total CMS returned an unexpected collection list.');
  }
  return data.filter(isRecord).map((item) => ({
    id: String(item['id'] ?? ''),
    name: typeof item['name'] === 'string' ? item['name'] : String(item['id'] ?? ''),
    schema: typeof item['schema'] === 'string' ? item['schema'] : '',
    description: typeof item['description'] === 'string' ? item['description'] : '',
    object_count: typeof item['totalObjects'] === 'number' ? item['totalObjects'] : null,
    label_singular: typeof item['labelSingular'] === 'string' ? item['labelSingular'] : '',
    label_plural: typeof item['labelPlural'] === 'string' ? item['labelPlural'] : '',
    singleton: item['singleton'] === true,
    last_updated: typeof item['lastUpdated'] === 'string' ? item['lastUpdated'] : null,
  }));
}

async function getSchema({ auth, collection }: { auth: TotalCmsConnection; collection: string }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: ['collections', seg({ value: collection, label: 'Collection' }), 'schema'],
    operation: `read the schema of collection "${collection}"`,
  });
  return unwrap(body);
}

async function queryObjects({
  auth,
  collection,
  limit,
  offset,
  sort,
  search,
  include,
  exclude,
}: {
  auth: TotalCmsConnection;
  collection: string;
  limit: number;
  offset: number;
  sort?: string;
  search?: string;
  include?: string;
  exclude?: string;
}): Promise<QueryPage> {
  const queryParams: QueryParams = { limit: String(limit), offset: String(offset) };
  if (sort) {
    queryParams['sort'] = sort;
  }
  if (search) {
    queryParams['search'] = search;
  }
  if (include) {
    queryParams['include'] = include;
  }
  if (exclude) {
    queryParams['exclude'] = exclude;
  }
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: ['collections', seg({ value: collection, label: 'Collection' }), 'query'],
    queryParams,
    operation: `query collection "${collection}"`,
  });
  if (!isRecord(body) || !Array.isArray(body['data'])) {
    throw new Error('Total CMS returned an unexpected query response.');
  }
  const meta = isRecord(body['meta']) ? body['meta'] : {};
  const pagination = isRecord(meta['pagination']) ? meta['pagination'] : {};
  const objects = body['data'].filter(isRecord);
  const total = typeof pagination['total'] === 'number' ? pagination['total'] : objects.length;
  return { objects, total };
}

async function getObject({ auth, collection, id }: { auth: TotalCmsConnection; collection: string; id: string }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: ['collections', seg({ value: collection, label: 'Collection' }), seg({ value: id, label: 'Object ID' })],
    operation: `read object "${id}" in collection "${collection}"`,
  });
  return unwrap(body);
}

async function findObject({ auth, collection, id }: { auth: TotalCmsConnection; collection: string; id: string }): Promise<Record<string, unknown> | null> {
  try {
    return await getObject({ auth, collection, id });
  } catch (error) {
    if (statusOf(error) === 404) {
      return null;
    }
    throw error;
  }
}

async function createObject({ auth, collection, fields }: { auth: TotalCmsConnection; collection: string; fields: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['collections', seg({ value: collection, label: 'Collection' })],
    body: fields,
    operation: `create an object in collection "${collection}"`,
  });
  return unwrap(body);
}

async function replaceObject({ auth, collection, id, fields }: { auth: TotalCmsConnection; collection: string; id: string; fields: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: ['collections', seg({ value: collection, label: 'Collection' }), seg({ value: id, label: 'Object ID' })],
    body: { ...fields, id: id.trim() },
    operation: `save object "${id}" in collection "${collection}"`,
  });
  return unwrap(body);
}

async function patchObject({ auth, collection, id, fields }: { auth: TotalCmsConnection; collection: string; id: string; fields: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.PATCH,
    path: ['collections', seg({ value: collection, label: 'Collection' }), seg({ value: id, label: 'Object ID' })],
    body: fields,
    operation: `update object "${id}" in collection "${collection}"`,
  });
  return unwrap(body);
}

async function deleteObject({ auth, collection, id }: { auth: TotalCmsConnection; collection: string; id: string }): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: ['collections', seg({ value: collection, label: 'Collection' }), seg({ value: id, label: 'Object ID' })],
    operation: `delete object "${id}" in collection "${collection}"`,
  });
}

async function cloneObject({
  auth,
  collection,
  id,
  newId,
  targetCollection,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  newId: string;
  targetCollection?: string;
}): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = { id: newId };
  if (targetCollection) {
    payload['collection'] = targetCollection;
  }
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['collections', seg({ value: collection, label: 'Collection' }), seg({ value: id, label: 'Object ID' }), 'clone'],
    body: payload,
    operation: `duplicate object "${id}" in collection "${collection}"`,
  });
  return unwrap(body);
}

async function adjustNumber({
  auth,
  collection,
  id,
  property,
  direction,
  amount,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  property: string;
  direction: 'increment' | 'decrement';
  amount: number;
}): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: [
      'collections',
      seg({ value: collection, label: 'Collection' }),
      seg({ value: id, label: 'Object ID' }),
      seg({ value: property, label: 'Field' }),
      direction,
      encodeURIComponent(String(amount)),
    ],
    operation: `${direction} field "${property}" of object "${id}"`,
  });
  return unwrap(body);
}

async function uploadFile({
  auth,
  collection,
  id,
  property,
  source,
  folder,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  property: string;
  source: UploadSource;
  folder?: string;
}): Promise<UploadResult> {
  const path = [
    'collections',
    seg({ value: collection, label: 'Collection' }),
    seg({ value: id, label: 'Object ID' }),
    seg({ value: property, label: 'Field' }),
  ];
  const folderSegments = folder ? splitFolder(folder) : [];
  path.push(...folderSegments.map((part) => encodeURIComponent(part)));
  const fieldName = folderSegments.length > 0 ? folderSegments[folderSegments.length - 1] : property.trim();
  let body: unknown;
  if (source.kind === 'file') {
    const form = new FormData();
    form.append(fieldName, source.data, { filename: source.filename });
    body = form;
  } else {
    body = { [fieldName]: source.url };
  }
  const response = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path,
    body,
    operation: `upload a file to field "${property}" of object "${id}"`,
  });
  const meta = isRecord(response) && isRecord(response['meta']) ? response['meta'] : {};
  const preview = typeof meta['preview'] === 'string' ? meta['preview'] : null;
  return {
    object: unwrap(response),
    preview_url: preview ? `${siteBase(auth)}${preview.startsWith('/') ? '' : '/'}${preview}` : null,
  };
}

async function patchFileMeta({
  auth,
  collection,
  id,
  property,
  fileName,
  fields,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  property: string;
  fileName?: string;
  fields: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const path = [
    'collections',
    seg({ value: collection, label: 'Collection' }),
    seg({ value: id, label: 'Object ID' }),
    seg({ value: property, label: 'Field' }),
  ];
  if (fileName) {
    path.push(seg({ value: fileName, label: 'File name' }));
  }
  const body = await request<unknown>({
    auth,
    method: HttpMethod.PATCH,
    path,
    body: fields,
    operation: `update the details of field "${property}" of object "${id}"`,
  });
  return unwrap(body);
}

function splitFolder(folder: string): string[] {
  const parts = folder
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  for (const part of parts) {
    if (part === '.' || part === '..' || part.includes('\\')) {
      throw new Error(`Folder "${folder.slice(0, 100)}" is not valid. Use folder names separated by /, for example 2026/reports.`);
    }
  }
  return parts;
}

function parseFileSource({ file, url }: { file: unknown; url: unknown }): UploadSource {
  const hasUrl = typeof url === 'string' && url.trim().length > 0;
  const hasFile = isFileLike(file);
  if (hasFile && hasUrl) {
    throw new Error('Provide either a file or a file URL, not both.');
  }
  if (hasFile) {
    return { kind: 'file', data: file.data, filename: file.filename };
  }
  if (hasUrl) {
    const text = url.trim();
    let parsed: URL;
    try {
      parsed = new URL(text);
    } catch {
      throw new Error(`"${text.slice(0, 200)}" is not a valid URL.`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('The file URL must start with http:// or https://.');
    }
    return { kind: 'url', url: text };
  }
  throw new Error('Provide a file or a file URL.');
}

function isFileLike(value: unknown): value is { data: Buffer; filename: string } {
  if (!isRecord(value) && !(typeof value === 'object' && value !== null)) {
    return false;
  }
  const data: unknown = Reflect.get(value, 'data');
  const filename: unknown = Reflect.get(value, 'filename');
  return Buffer.isBuffer(data) && typeof filename === 'string' && filename.length > 0;
}

export const totalcmsApi = {
  listCollections,
  getSchema,
  queryObjects,
  getObject,
  findObject,
  createObject,
  replaceObject,
  patchObject,
  deleteObject,
  cloneObject,
  adjustNumber,
  uploadFile,
  patchFileMeta,
};

export const totalcmsHelpers = {
  isRecord,
  statusOf,
  parseFileSource,
  apiBase,
  siteBase,
};

export type TotalCmsConnection = { props: { domain: string; apiKey: string } };

export type TotalCmsCollection = {
  id: string;
  name: string;
  schema: string;
  description: string;
  object_count: number | null;
  label_singular: string;
  label_plural: string;
  singleton: boolean;
  last_updated: string | null;
};

export type QueryPage = { objects: Record<string, unknown>[]; total: number };

export type UploadSource = { kind: 'file'; data: Buffer; filename: string } | { kind: 'url'; url: string };

export type UploadResult = { object: Record<string, unknown>; preview_url: string | null };
