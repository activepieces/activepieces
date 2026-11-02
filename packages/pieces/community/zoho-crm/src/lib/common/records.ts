import { HttpMethod } from '@activepieces/pieces-common';
import {
  ZohoAuth,
  ZohoCrmError,
  ZohoListResponse,
  ZohoWriteItem,
  flattenWriteResult,
  isRecord,
  readField,
  readString,
  unwrapWriteItem,
  zohoRequest,
} from './client';
import { ZohoField, listFields } from './metadata';

const enc = encodeURIComponent;

export async function tryListFields({ auth, module }: { auth: ZohoAuth; module: string }): Promise<ZohoField[] | undefined> {
  try {
    return await listFields({ auth, module });
  } catch (error) {
    if (error instanceof ZohoCrmError && (error.status === 403 || METADATA_REFUSED_CODES.has(error.code ?? ''))) {
      return undefined;
    }
    throw error;
  }
}

const METADATA_REFUSED_CODES = new Set(['NO_PERMISSION', 'OAUTH_SCOPE_MISMATCH']);

function ensureExactNumbers({ value, path }: { value: unknown; path: string }): void {
  if (typeof value === 'number' && Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new ZohoCrmError(`${path} arrived as a number above 2^53, which is already rounded; pass it as text (the exact digits).`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => ensureExactNumbers({ value: item, path: `${path}[${index}]` }));
  } else if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) => ensureExactNumbers({ value: item, path: `${path}.${key}` }));
  }
}

function validateRecord({ record, what }: { record: Record<string, unknown>; what: string }): void {
  Object.entries(record).forEach(([key, item]) => ensureExactNumbers({ value: item, path: key }));
  if (Object.keys(record).length === 0) {
    throw new ZohoCrmError(`${what}: no fields were provided.`);
  }
}

export async function createRecord({
  auth,
  module,
  record,
  trigger,
}: {
  auth: ZohoAuth;
  module: string;
  record: Record<string, unknown>;
  trigger?: string[];
}): Promise<Record<string, unknown>> {
  validateRecord({ record, what: 'Create record' });
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/${enc(module)}`,
    body: { data: [record], ...(trigger !== undefined ? { trigger } : {}) },
  });
  return { module, ...flattenWriteResult(unwrapWriteItem({ body })) };
}

export async function updateRecord({
  auth,
  module,
  id,
  record,
  trigger,
  appendMultiSelect,
}: {
  auth: ZohoAuth;
  module: string;
  id: string;
  record: Record<string, unknown>;
  trigger?: string[];
  appendMultiSelect?: string[];
}): Promise<Record<string, unknown>> {
  validateRecord({ record, what: 'Update record' });
  const data: Record<string, unknown> = { ...record };
  if (appendMultiSelect && appendMultiSelect.length > 0) {
    data['$append_values'] = Object.fromEntries(appendMultiSelect.map((f) => [f, true]));
  }
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/${enc(module)}/${enc(id)}`,
    body: { data: [data], ...(trigger !== undefined ? { trigger } : {}) },
  });
  return { module, ...flattenWriteResult(unwrapWriteItem({ body })) };
}

export async function upsertRecord({
  auth,
  module,
  record,
  duplicateCheckFields,
  trigger,
}: {
  auth: ZohoAuth;
  module: string;
  record: Record<string, unknown>;
  duplicateCheckFields?: string[];
  trigger?: string[];
}): Promise<Record<string, unknown>> {
  validateRecord({ record, what: 'Upsert record' });
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/${enc(module)}/upsert`,
    body: {
      data: [record],
      ...(duplicateCheckFields && duplicateCheckFields.length > 0 ? { duplicate_check_fields: duplicateCheckFields } : {}),
      ...(trigger !== undefined ? { trigger } : {}),
    },
  });
  return { module, ...flattenWriteResult(unwrapWriteItem({ body })) };
}

export async function getRecord({
  auth,
  module,
  id,
  fields,
}: {
  auth: ZohoAuth;
  module: string;
  id: string;
  fields?: string[];
}): Promise<Record<string, unknown>> {
  const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
    auth,
    method: HttpMethod.GET,
    path: `/${enc(module)}/${enc(id)}`,
    query: fields && fields.length > 0 ? { fields: fields.join(',') } : undefined,
  });
  const record = body?.data?.[0];
  if (!record) {
    throw new ZohoCrmError(`No ${module} record with id ${id} was found.`, 404, 'NOT_FOUND');
  }
  return record;
}

export async function deleteRecord({
  auth,
  module,
  id,
  runWorkflows,
}: {
  auth: ZohoAuth;
  module: string;
  id: string;
  runWorkflows?: boolean;
}): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await zohoRequest<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/${enc(module)}/${enc(id)}`,
      query: runWorkflows === false ? { wf_trigger: 'false' } : undefined,
    });
  } catch (error) {
    throw notDeletedError({ error, what: `${module} record ${id}` });
  }
  const item = unwrapWriteItem({ body });
  return { module, deleted: true, ...flattenWriteResult(item), id: readString(item.details?.['id']) ?? id };
}

export function notDeletedError({ error, what }: { error: unknown; what: string }): unknown {
  if (error instanceof ZohoCrmError && error.code === 'INVALID_DATA') {
    return new ZohoCrmError(
      `Zoho CRM INVALID_DATA: could not delete ${what}; it does not exist or was already deleted.`,
      error.status,
      error.code,
    );
  }
  return error;
}

export type ConvertLeadInput = {
  auth: ZohoAuth;
  leadId: string;
  accountId?: string;
  contactId?: string;
  assignTo?: string;
  overwrite?: boolean;
  notifyLeadOwner?: boolean;
  notifyNewEntityOwner?: boolean;
  deal?: Record<string, unknown>;
};

export async function convertLead(input: ConvertLeadInput): Promise<Record<string, unknown>> {
  const entry: Record<string, unknown> = {};
  if (input.overwrite !== undefined) entry['overwrite'] = input.overwrite;
  if (input.notifyLeadOwner !== undefined) entry['notify_lead_owner'] = input.notifyLeadOwner;
  if (input.notifyNewEntityOwner !== undefined) entry['notify_new_entity_owner'] = input.notifyNewEntityOwner;
  if (input.accountId) entry['Accounts'] = { id: input.accountId };
  if (input.contactId) entry['Contacts'] = { id: input.contactId };
  if (input.assignTo) entry['assign_to'] = { id: input.assignTo };
  if (input.deal && Object.keys(input.deal).length > 0) {
    Object.entries(input.deal).forEach(([key, item]) => ensureExactNumbers({ value: item, path: `Deal ${key}` }));
    entry['Deals'] = input.deal;
  }
  let item: ZohoWriteItem;
  try {
    const body = await zohoRequest<unknown>({
      auth: input.auth,
      method: HttpMethod.POST,
      path: `/Leads/${enc(input.leadId)}/actions/convert`,
      body: { data: [entry] },
    });
    item = unwrapWriteItem({ body });
  } catch (error) {
    throw convertMismatchError(error);
  }
  const d = item.details ?? {};
  const refText = ({ entity, key }: { entity: string; key: string }): string | null =>
    readString(readField({ value: d[entity], key })) ?? null;
  return {
    lead_id: input.leadId,
    status: item.status ?? null,
    message: item.message ?? null,
    contact_id: refText({ entity: 'Contacts', key: 'id' }),
    contact_name: refText({ entity: 'Contacts', key: 'name' }),
    account_id: refText({ entity: 'Accounts', key: 'id' }),
    account_name: refText({ entity: 'Accounts', key: 'name' }),
    deal_id: refText({ entity: 'Deals', key: 'id' }),
    deal_name: refText({ entity: 'Deals', key: 'name' }),
  };
}

function convertMismatchError(error: unknown): unknown {
  if (!(error instanceof ZohoCrmError) || error.code !== 'INVALID_DATA') {
    return error;
  }
  const match = /(Account|Contact) data doesn't match/i.exec(error.message);
  if (!match) {
    return error;
  }
  const rule =
    match[1].toLowerCase() === 'account'
      ? "Zoho links an existing account only when the lead's Company equals the account name"
      : "Zoho merges into an existing contact only when the lead's name and email match the contact";
  return new ZohoCrmError(
    `Zoho CRM INVALID_DATA: ${match[1]} data doesn't match the lead. ${rule}. Update the lead first, or leave Existing ${match[1]} empty to create a new one.`,
    error.status,
    error.code,
  );
}

export async function createNote({
  auth,
  module,
  recordId,
  title,
  content,
}: {
  auth: ZohoAuth;
  module: string;
  recordId: string;
  title?: string;
  content: string;
}): Promise<Record<string, unknown>> {
  if (!content || content.trim().length === 0) {
    throw new ZohoCrmError('Note content is required.');
  }
  const note: Record<string, unknown> = {
    Parent_Id: { module: { api_name: module }, id: recordId },
    Note_Content: content,
  };
  if (title && title.length > 0) note['Note_Title'] = title;
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/Notes',
    body: { data: [note] },
  });
  return { parent_module: module, parent_id: recordId, ...flattenWriteResult(unwrapWriteItem({ body })) };
}

export type TagRef = { name?: string; id?: string };

export async function changeTags({
  auth,
  module,
  recordIds,
  tags,
  mode,
}: {
  auth: ZohoAuth;
  module: string;
  recordIds: string[];
  tags: TagRef[];
  mode: 'add' | 'remove';
}): Promise<Record<string, unknown>> {
  if (recordIds.length === 0) throw new ZohoCrmError('At least one record id is required.');
  if (recordIds.length > 500) throw new ZohoCrmError('Zoho accepts at most 500 record ids per call.');
  if (tags.length === 0) throw new ZohoCrmError('At least one tag is required.');
  const body = await zohoRequest<{ data?: { status?: string; code?: string; message?: string; details?: Record<string, unknown> }[] }>({
    auth,
    method: HttpMethod.POST,
    path: `/${enc(module)}/actions/${mode === 'add' ? 'add_tags' : 'remove_tags'}`,
    body: { tags, ids: recordIds, ...(mode === 'add' ? { over_write: false } : {}) },
  });
  const rows = (body?.data ?? []).map((r) => ({
    id: readString(r.details?.['id']) ?? null,
    status: r.status ?? null,
    code: r.code ?? null,
    message: r.message ?? null,
    tags: tagNames(r.details?.['tags']),
  }));
  const failed = rows.filter((r) => r.status === 'error');
  if (rows.length > 0 && failed.length === rows.length) {
    throw new ZohoCrmError(`Zoho CRM ${failed[0].code}: ${failed[0].message}`);
  }
  return { module, results: rows, success_count: rows.length - failed.length, failed_count: failed.length };
}

export type ZohoTag = { id: string; name: string; color_code?: string | null; created_time?: string; modified_time?: string };

export async function listTags({ auth, module }: { auth: ZohoAuth; module: string }): Promise<ZohoTag[]> {
  const body = await zohoRequest<{ tags?: ZohoTag[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/settings/tags',
    query: { module },
  });
  return body?.tags ?? [];
}

export const TAG_COLORS = [
  '#F17574', '#F48435', '#E7A826', '#A8C026', '#63C57E', '#1DB9B4', '#57B1FD',
  '#879BFC', '#D297EE', '#FD87BD', '#969696', '#658BA8', '#B88562',
];

export async function ensureTag({
  auth,
  module,
  name,
  colorCode,
}: {
  auth: ZohoAuth;
  module: string;
  name: string;
  colorCode?: string;
}): Promise<{ tag: ZohoTag; created: boolean }> {
  const clean = name.trim();
  if (clean.length === 0) throw new ZohoCrmError('Tag name is required.');
  if (colorCode && !TAG_COLORS.includes(colorCode.toUpperCase())) {
    throw new ZohoCrmError(`color_code must be one of ${TAG_COLORS.join(', ')}.`);
  }
  const existing = (await listTags({ auth, module })).find((t) => t.name.toLowerCase() === clean.toLowerCase());
  if (existing) return { tag: existing, created: false };
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/settings/tags',
    query: { module },
    body: { tags: [{ name: clean, ...(colorCode ? { color_code: colorCode.toUpperCase() } : {}) }] },
  });
  const item = unwrapWriteItem({ body, key: 'tags' });
  const d = item.details ?? {};
  return {
    tag: { id: String(d['id'] ?? ''), name: clean, color_code: colorCode ?? null, created_time: readString(d['created_time']) },
    created: true,
  };
}

export async function uploadAttachment({
  auth,
  module,
  recordId,
  file,
  attachmentUrl,
  title,
}: {
  auth: ZohoAuth;
  module: string;
  recordId: string;
  file?: { filename: string; data: Buffer };
  attachmentUrl?: string;
  title?: string;
}): Promise<Record<string, unknown>> {
  if ((file ? 1 : 0) + (attachmentUrl ? 1 : 0) !== 1) {
    throw new ZohoCrmError('Provide exactly one of a file or an attachment URL.');
  }
  const parts: MultipartPart[] = [];
  if (file) {
    parts.push({ name: 'file', filename: file.filename, data: file.data });
  } else if (attachmentUrl) {
    let parsed: URL;
    try {
      parsed = new URL(attachmentUrl);
    } catch {
      throw new ZohoCrmError('attachment_url must be a full http(s) URL.');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new ZohoCrmError('attachment_url must be a full http(s) URL.');
    }
    parts.push({ name: 'attachmentUrl', data: attachmentUrl });
    if (title) parts.push({ name: 'title', data: title });
  }
  const multipart = buildMultipart({ parts });
  const body = await zohoRequest<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/${enc(module)}/${enc(recordId)}/Attachments`,
    headers: { 'Content-Type': multipart.contentType },
    body: multipart.body,
  });
  return { parent_module: module, parent_id: recordId, ...flattenWriteResult(unwrapWriteItem({ body })) };
}

export function readApFile(value: unknown): { filename: string; data: Buffer } {
  if (!isRecord(value)) {
    throw new ZohoCrmError('File is required.');
  }
  const data = value['data'];
  const rawName = value['filename'];
  const base64 = value['base64'];
  const filename = typeof rawName === 'string' && rawName.length > 0 ? rawName : 'attachment';
  if (Buffer.isBuffer(data)) return { filename, data };
  if (data instanceof Uint8Array) return { filename, data: Buffer.from(data) };
  if (typeof base64 === 'string') return { filename, data: Buffer.from(base64, 'base64') };
  throw new ZohoCrmError('File could not be read (no data).');
}

export function buildMultipart({
  parts,
  boundary = `----apZoho${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
}: {
  parts: MultipartPart[];
  boundary?: string;
}): { body: Buffer; contentType: string } {
  const chunks: Buffer[] = [];
  for (const part of parts) {
    const safeName = (part.filename ?? '').replace(/["\r\n]/g, '_');
    const disposition = part.filename !== undefined
      ? `form-data; name="${part.name}"; filename="${safeName}"`
      : `form-data; name="${part.name}"`;
    const head = `--${boundary}\r\nContent-Disposition: ${disposition}\r\n${part.filename !== undefined ? 'Content-Type: application/octet-stream\r\n' : ''}\r\n`;
    chunks.push(Buffer.from(head, 'utf8'));
    chunks.push(typeof part.data === 'string' ? Buffer.from(part.data, 'utf8') : part.data);
    chunks.push(Buffer.from('\r\n', 'utf8'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

function tagNames(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value
    .map((t) => readString(readField({ value: t, key: 'name' })))
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .join(', ');
}

type MultipartPart = { name: string; data: string | Buffer; filename?: string };
