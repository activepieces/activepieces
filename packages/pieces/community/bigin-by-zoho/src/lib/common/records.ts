import { HttpMethod } from '@activepieces/pieces-common';
import {
  BiginApiError,
  BiginConnection,
  assertWriteSucceeded,
  biginRequest,
  isObject,
} from './request';
import { BIGIN_DEFAULT_LIST_FIELDS } from './constants';

function toRecordList(value: unknown): BiginRecord[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function readInfo(body: Record<string, unknown>): Record<string, unknown> {
  return isObject(body['info']) ? body['info'] : {};
}

async function getRecord({
  connection,
  module,
  id,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
}): Promise<BiginRecord> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.GET,
    path: `/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
  });
  const record = toRecordList(body['data'])[0];
  if (!record) {
    throw new BiginApiError({
      status: 404,
      code: 'NOT_FOUND',
      detail: `No ${module} record found with id ${id}`,
      responseBody: body,
    });
  }
  return record;
}

async function findRecord({
  connection,
  module,
  id,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
}): Promise<BiginRecord | undefined> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.GET,
    path: `/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
  });
  return toRecordList(body['data'])[0];
}

async function listRecords({
  connection,
  module,
  fields,
  page,
  perPage,
  pageToken,
  sortBy,
  sortOrder,
}: {
  connection: BiginConnection;
  module: string;
  fields?: string;
  page?: number;
  perPage?: number;
  pageToken?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<BiginRecordPage> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.GET,
    path: `/${encodeURIComponent(module)}`,
    query: {
      fields: fields && fields.trim() !== '' ? fields : BIGIN_DEFAULT_LIST_FIELDS[module] ?? 'Owner,Created_Time,Modified_Time',
      page: pageToken ? undefined : page,
      per_page: perPage,
      page_token: pageToken,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  });
  const info = readInfo(body);
  return {
    records: toRecordList(body['data']),
    more_records: info['more_records'] === true,
    page: typeof info['page'] === 'number' ? info['page'] : page ?? 1,
    per_page: typeof info['per_page'] === 'number' ? info['per_page'] : perPage ?? 200,
    next_page_token: typeof info['next_page_token'] === 'string' ? info['next_page_token'] : null,
  };
}

async function listAllRecords({
  connection,
  module,
  fields,
  maxPages = 5,
}: {
  connection: BiginConnection;
  module: string;
  fields: string;
  maxPages?: number;
}): Promise<BiginRecord[]> {
  const all: BiginRecord[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await listRecords({ connection, module, fields, page, perPage: 200 });
    all.push(...result.records);
    if (!result.more_records) break;
  }
  return all;
}

async function searchRecords({
  connection,
  module,
  key,
  value,
  page,
  perPage,
}: {
  connection: BiginConnection;
  module: string;
  key: 'criteria' | 'email' | 'phone' | 'word';
  value: string;
  page?: number;
  perPage?: number;
}): Promise<BiginSearchPage> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.GET,
    path: `/${encodeURIComponent(module)}/search`,
    query: { [key]: value, page, per_page: perPage },
  });
  const info = readInfo(body);
  const records = toRecordList(body['data']);
  return {
    records,
    more_records: info['more_records'] === true,
    page: typeof info['page'] === 'number' ? info['page'] : page ?? 1,
    per_page: typeof info['per_page'] === 'number' ? info['per_page'] : perPage ?? 200,
    count: records.length,
  };
}

function readWriteItem(body: Record<string, unknown>): Record<string, unknown> {
  const item = Array.isArray(body['data']) ? body['data'][0] : undefined;
  assertWriteSucceeded(item);
  if (!isObject(item) || !isObject(item['details']) || typeof item['details']['id'] !== 'string') {
    throw new BiginApiError({
      status: 500,
      code: 'UNEXPECTED_RESPONSE',
      detail: 'Bigin did not return a record id',
      responseBody: body,
    });
  }
  return item['details'];
}

async function readBackOrDetails({
  connection,
  module,
  id,
  details,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
  details: Record<string, unknown>;
}): Promise<BiginRecord> {
  try {
    return await getRecord({ connection, module, id });
  } catch {
    return { ...details, id };
  }
}

function relatedModuleForApi(module: string | null | undefined): string | undefined {
  if (!module) return undefined;
  return module === 'Pipelines' ? 'Deals' : module;
}

async function createRecord({
  connection,
  module,
  record,
}: {
  connection: BiginConnection;
  module: string;
  record: Record<string, unknown>;
}): Promise<BiginWriteResult> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.POST,
    path: `/${encodeURIComponent(module)}`,
    body: { data: [record] },
  });
  const details = readWriteItem(body);
  const id = String(details['id']);
  const saved = await readBackOrDetails({ connection, module, id, details });
  return {
    id,
    created_time: typeof details['Created_Time'] === 'string' ? details['Created_Time'] : null,
    record: saved,
  };
}

async function updateRecord({
  connection,
  module,
  id,
  record,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
  record: Record<string, unknown>;
}): Promise<BiginUpdateResult> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.PUT,
    path: `/${encodeURIComponent(module)}`,
    body: { data: [{ ...record, id }] },
  });
  const details = readWriteItem(body);
  const saved = await readBackOrDetails({ connection, module, id, details });
  return {
    id,
    modified_time: typeof details['Modified_Time'] === 'string' ? details['Modified_Time'] : null,
    record: saved,
  };
}

async function deleteRecord({
  connection,
  module,
  id,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
}): Promise<{ id: string; deleted: boolean }> {
  const body = await biginRequest({
    connection,
    method: HttpMethod.DELETE,
    path: `/${encodeURIComponent(module)}`,
    query: { ids: id },
  });
  readWriteItem(body);
  return { id, deleted: true };
}

async function addNote({
  connection,
  module,
  id,
  title,
  content,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
  title?: string;
  content: string;
}): Promise<{ id: string; created_time: string | null; parent_id: string; module: string }> {
  const note: Record<string, unknown> = { Note_Content: content };
  if (title && title.trim() !== '') note['Note_Title'] = title;
  const body = await biginRequest({
    connection,
    method: HttpMethod.POST,
    path: `/${encodeURIComponent(module)}/${encodeURIComponent(id)}/Notes`,
    body: { data: [note] },
  });
  const details = readWriteItem(body);
  return {
    id: String(details['id']),
    created_time: typeof details['Created_Time'] === 'string' ? details['Created_Time'] : null,
    parent_id: id,
    module,
  };
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    result[key] = value;
  }
  return result;
}

function mergeAdditionalFields({
  record,
  additionalFields,
}: {
  record: Record<string, unknown>;
  additionalFields: unknown;
}): Record<string, unknown> {
  const merged = compactRecord(record);
  if (additionalFields === undefined || additionalFields === null || additionalFields === '') {
    return merged;
  }
  if (!isObject(additionalFields)) {
    throw new Error('Additional Fields must be a JSON object of Bigin field API names to values.');
  }
  return { ...merged, ...additionalFields };
}

function lookup(id: string | undefined): { id: string } | undefined {
  return id && id.trim() !== '' ? { id: id.trim() } : undefined;
}

async function mergeTagsWithExisting({
  connection,
  module,
  id,
  tags,
}: {
  connection: BiginConnection;
  module: string;
  id: string;
  tags: unknown;
}): Promise<{ name: string }[] | undefined> {
  const added = toTagList(tags);
  if (!added) return undefined;
  const current = await getRecord({ connection, module, id });
  const byKey = new Map<string, string>();
  for (const name of [...existingTagNames(current['Tag']), ...added.map((tag) => tag.name)]) {
    const key = name.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, name);
  }
  return [...byKey.values()].map((name) => ({ name }));
}

function existingTagNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((tag) => (isObject(tag) && typeof tag['name'] === 'string' && tag['name'].trim() !== '' ? [tag['name'].trim()] : []));
}

function toTagList(tags: unknown): { name: string }[] | undefined {
  if (!Array.isArray(tags)) return undefined;
  const names = tags.map((t) => String(t).trim()).filter((t) => t !== '');
  return names.length > 0 ? names.map((name) => ({ name })) : undefined;
}

type BiginRecord = Record<string, unknown>;

type BiginRecordPage = {
  records: BiginRecord[];
  more_records: boolean;
  page: number;
  per_page: number;
  next_page_token: string | null;
};

type BiginSearchPage = {
  records: BiginRecord[];
  more_records: boolean;
  page: number;
  per_page: number;
  count: number;
};

type BiginWriteResult = {
  id: string;
  created_time: string | null;
  record: BiginRecord;
};

type BiginUpdateResult = {
  id: string;
  modified_time: string | null;
  record: BiginRecord;
};

export const biginRecords = {
  relatedModuleForApi,
  get: getRecord,
  find: findRecord,
  list: listRecords,
  listAll: listAllRecords,
  search: searchRecords,
  create: createRecord,
  update: updateRecord,
  delete: deleteRecord,
  addNote,
  mergeAdditionalFields,
  compactRecord,
  lookup,
  toTagList,
  mergeTagsWithExisting,
};

export type { BiginRecord, BiginRecordPage, BiginSearchPage, BiginWriteResult, BiginUpdateResult };
