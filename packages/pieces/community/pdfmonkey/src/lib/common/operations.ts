import { HttpMethod } from '@activepieces/pieces-common';
import { pdfmonkeyClient, PdfmonkeyApiError } from './client';

const MAX_LIST_PAGES = 20;
const POLL_INTERVAL_MS = 3000;
const AI_MAX_WAIT_MS = 240000;
const DOCUMENT_STATUSES = ['draft', 'pending', 'generating', 'success', 'failure'];

async function createDocument({
  auth,
  templateId,
  payload,
  meta,
  filename,
  status,
  waitForCompletion,
  maxWaitMs,
}: {
  auth: unknown;
  templateId: unknown;
  payload: unknown;
  meta?: unknown;
  filename?: unknown;
  status?: unknown;
  waitForCompletion?: boolean;
  maxWaitMs?: number;
}): Promise<Record<string, unknown>> {
  const document_template_id = requiredText({ value: templateId, label: 'Template ID' });
  const parsedPayload = jsonObject({ value: payload, label: 'Payload' }) ?? {};
  const mergedMeta = withFilename({ meta: jsonObject({ value: meta, label: 'Meta' }), filename });
  const finalStatus = waitForCompletion ? 'pending' : createStatus(status);
  const document: Record<string, unknown> = { document_template_id, status: finalStatus, payload: parsedPayload };
  if (mergedMeta !== undefined) document['meta'] = mergedMeta;
  if (waitForCompletion && maxWaitMs !== undefined) {
    const response = await pdfmonkeyClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/documents',
      body: { document },
    });
    const created = unwrap({ body: response.body, key: 'document' });
    return waitForDocument({ auth, created, deadline: Date.now() + maxWaitMs });
  }
  if (waitForCompletion) {
    const response = await pdfmonkeyClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/documents/sync',
      body: { document },
      timeout: pdfmonkeyClient.SYNC_TIMEOUT_MS,
    });
    const card = unwrap({ body: response.body, key: 'document_card' });
    if (card['status'] === 'failure') {
      throw new Error(`PDFMonkey could not generate document ${String(card['id'])}: ${failureCause(card)}.`);
    }
    return card;
  }
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.POST,
    path: '/documents',
    body: { document },
  });
  return unwrap({ body: response.body, key: 'document' });
}

async function waitForDocument({
  auth,
  created,
  deadline,
}: {
  auth: unknown;
  created: Record<string, unknown>;
  deadline: number;
}): Promise<Record<string, unknown>> {
  let lastKnown = created;
  for (;;) {
    const card = await readCardIfReachable({ auth, documentId: created['id'] });
    if (card !== null) {
      if (card['status'] === 'failure') {
        throw new Error(`PDFMonkey could not generate document ${String(card['id'])}: ${failureCause(card)}.`);
      }
      if (card['status'] === 'success') return card;
      lastKnown = card;
    }
    if (Date.now() + POLL_INTERVAL_MS > deadline) return lastKnown;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function readCardIfReachable({ auth, documentId }: { auth: unknown; documentId: unknown }): Promise<Record<string, unknown> | null> {
  try {
    return await getDocumentCard({ auth, documentId });
  } catch (error) {
    if (isTransient(error)) return null;
    throw error;
  }
}

function isTransient(error: unknown): boolean {
  if (!(error instanceof PdfmonkeyApiError)) return true;
  return error.status === 408 || error.status === 429 || error.status >= 500;
}

async function updateDocument({
  auth,
  documentId,
  templateId,
  payload,
  meta,
  filename,
  generate,
}: {
  auth: unknown;
  documentId: unknown;
  templateId?: unknown;
  payload?: unknown;
  meta?: unknown;
  filename?: unknown;
  generate?: boolean;
}): Promise<Record<string, unknown>> {
  const id = pdfmonkeyClient.segment({ value: documentId, label: 'Document ID' });
  const document: Record<string, unknown> = {};
  const template = optionalText(templateId);
  if (template !== undefined) document['document_template_id'] = template;
  const parsedPayload = jsonObject({ value: payload, label: 'Payload' });
  if (parsedPayload !== undefined) document['payload'] = parsedPayload;
  const parsedMeta = jsonObject({ value: meta, label: 'Meta' });
  const name = optionalText(filename);
  if (parsedMeta !== undefined || name !== undefined) {
    const base = parsedMeta ?? parseMeta((await getDocumentCard({ auth, documentId }))['meta']);
    document['meta'] = withFilename({ meta: base, filename: name });
  }
  if (generate) document['status'] = 'pending';
  if (Object.keys(document).length === 0) {
    throw new Error('Nothing to update. Set a template, payload, meta, file name or turn on Generate Now.');
  }
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.PUT,
    path: `/documents/${id}`,
    body: { document },
  });
  return unwrap({ body: response.body, key: 'document' });
}

async function getDocument({ auth, documentId }: { auth: unknown; documentId: unknown }): Promise<Record<string, unknown>> {
  const id = pdfmonkeyClient.segment({ value: documentId, label: 'Document ID' });
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/documents/${id}` });
  return unwrap({ body: response.body, key: 'document' });
}

async function getDocumentCard({ auth, documentId }: { auth: unknown; documentId: unknown }): Promise<DocumentCard> {
  const id = pdfmonkeyClient.segment({ value: documentId, label: 'Document ID' });
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/document_cards/${id}` });
  return unwrap({ body: response.body, key: 'document_card' });
}

async function listDocuments({
  auth,
  templateId,
  status,
  search,
  updatedSince,
  page,
}: {
  auth: unknown;
  templateId?: unknown;
  status?: unknown;
  search?: unknown;
  updatedSince?: unknown;
  page?: unknown;
}): Promise<{ documents: DocumentCard[]; page: number; total_pages: number; has_more: boolean }> {
  const statusFilter = optionalText(status);
  if (statusFilter !== undefined && !DOCUMENT_STATUSES.includes(statusFilter)) {
    throw new Error(`Status must be one of: ${DOCUMENT_STATUSES.join(', ')}.`);
  }
  const pageNumber = positiveInteger({ value: page, label: 'Page' }) ?? 1;
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.GET,
    path: '/document_cards',
    query: {
      'page[number]': pageNumber,
      'q[document_template_id]': optionalText(templateId),
      'q[status]': statusFilter,
      'q[search]': optionalText(search),
      'q[updated_since]': unixSeconds(updatedSince),
    },
  });
  const documents = arrayOf(response.body['document_cards']);
  const meta = pageMeta(response.body['meta']);
  return { documents, page: meta.current_page ?? pageNumber, total_pages: meta.total_pages ?? pageNumber, has_more: meta.next_page !== null && meta.next_page !== undefined };
}

async function listAllDocumentCards({
  auth,
  query,
  maxPages = MAX_LIST_PAGES,
}: {
  auth: unknown;
  query: Record<string, string | undefined>;
  maxPages?: number;
}): Promise<{ items: DocumentCard[]; truncated: boolean }> {
  const items: DocumentCard[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const response = await pdfmonkeyClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: '/document_cards',
      query: { ...query, 'page[number]': page },
    });
    items.push(...arrayOf(response.body['document_cards']));
    const meta = pageMeta(response.body['meta']);
    if (meta.next_page === null || meta.next_page === undefined) {
      return { items, truncated: false };
    }
  }
  return { items, truncated: true };
}

async function deleteDocument({ auth, documentId }: { auth: unknown; documentId: unknown }): Promise<{ success: true; document_id: string }> {
  const id = pdfmonkeyClient.segment({ value: documentId, label: 'Document ID' });
  await pdfmonkeyClient.request({ auth, method: HttpMethod.DELETE, path: `/documents/${id}` });
  return { success: true, document_id: decodeURIComponent(id) };
}

async function downloadDocument({
  auth,
  documentId,
  fileName,
  files,
}: {
  auth: unknown;
  documentId: unknown;
  fileName?: unknown;
  files: { write: (params: { fileName: string; data: Buffer }) => Promise<string> };
}): Promise<Record<string, unknown>> {
  const card = await getDocumentCard({ auth, documentId });
  if (card['status'] !== 'success') {
    throw new Error(`Document ${String(card['id'])} is "${String(card['status'])}", not "success", so there is no file to download yet.`);
  }
  const url = card['download_url'];
  if (typeof url !== 'string' || url === '') {
    throw new Error('PDFMonkey did not return a download URL for this document.');
  }
  const { data, contentType } = await pdfmonkeyClient.download({ url });
  const name = optionalText(fileName) ?? (typeof card['filename'] === 'string' && card['filename'] ? card['filename'] : `${String(card['id'])}.${card['output_type'] === 'image' ? 'png' : 'pdf'}`);
  const file = await files.write({ fileName: name, data });
  return {
    file,
    file_name: name,
    size: data.length,
    content_type: contentType ?? null,
    document_id: card['id'],
    document_template_id: card['document_template_id'],
    document_template_identifier: card['document_template_identifier'],
    status: card['status'],
  };
}

async function listTemplates({ auth, workspaceId }: { auth: unknown; workspaceId?: unknown }): Promise<{ templates: Record<string, unknown>[]; truncated: boolean }> {
  const given = optionalText(workspaceId);
  const workspaces = given !== undefined ? [given] : await listWorkspaceIds({ auth });
  const templates: Record<string, unknown>[] = [];
  for (const workspace of workspaces) {
    for (let page = 1; page <= MAX_LIST_PAGES; page++) {
      const response = await pdfmonkeyClient.request<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        path: '/document_template_cards',
        query: { 'q[workspace_id]': workspace, page },
      });
      templates.push(...arrayOf(response.body['document_template_cards']).map(withoutHiddenFields));
      const meta = pageMeta(response.body['meta']);
      if (meta.next_page === null || meta.next_page === undefined) break;
      if (page === MAX_LIST_PAGES) return { templates, truncated: true };
    }
  }
  return { templates, truncated: false };
}

async function listWorkspaceIds({ auth }: { auth: unknown }): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const response = await pdfmonkeyClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: '/workspaces', query: { page } });
    for (const workspace of arrayOf(response.body['apps'])) {
      if (typeof workspace['id'] === 'string') ids.push(workspace['id']);
    }
    const meta = pageMeta(response.body['meta']);
    if (meta.next_page === null || meta.next_page === undefined) break;
  }
  return ids;
}

async function getTemplate({ auth, templateId }: { auth: unknown; templateId: unknown }): Promise<Record<string, unknown>> {
  const id = pdfmonkeyClient.segment({ value: templateId, label: 'Template ID' });
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/document_templates/${id}` });
  const template = unwrap({ body: response.body, key: 'document_template' });
  return withoutHiddenFields(template);
}

function withoutHiddenFields(template: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(template).filter(([key]) => !HIDDEN_TEMPLATE_FIELDS.includes(key)));
}

async function getCurrentUser({ auth }: { auth: unknown }): Promise<Record<string, unknown>> {
  const response = await pdfmonkeyClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: '/current_user' });
  const user = unwrap({ body: response.body, key: 'current_user' });
  return Object.fromEntries(USER_FIELDS.map((key) => [key, user[key] ?? null]));
}

function unwrap({ body, key }: { body: unknown; key: string }): Record<string, unknown> {
  const value = pdfmonkeyClient.isRecord(body) ? body[key] : undefined;
  if (!pdfmonkeyClient.isRecord(value)) {
    throw new PdfmonkeyApiError(`PDFMonkey returned an unexpected response (no ${key}).`, 200, body);
  }
  return value;
}

function failureCause(card: Record<string, unknown>): string {
  return typeof card['failure_cause'] === 'string' && card['failure_cause'] ? card['failure_cause'] : 'no reason given';
}

function arrayOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(pdfmonkeyClient.isRecord) : [];
}

function pageMeta(value: unknown): { current_page?: number; total_pages?: number; next_page?: number | null } {
  if (!pdfmonkeyClient.isRecord(value)) return { next_page: null };
  const number = (input: unknown) => (typeof input === 'number' ? input : undefined);
  return {
    current_page: number(value['current_page']),
    total_pages: number(value['total_pages']),
    next_page: typeof value['next_page'] === 'number' ? value['next_page'] : null,
  };
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) throw new Error(`${label} is required.`);
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function positiveInteger({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} must be a whole number of 1 or more.`);
  return number;
}

function unixSeconds(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const ms = typeof value === 'number' ? value : Date.parse(String(value));
  if (!Number.isFinite(ms)) throw new Error('Updated Since must be a date, e.g. 2026-01-31T00:00:00Z.');
  return Math.floor(ms / 1000);
}

function jsonObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object.`);
    }
  }
  if (!pdfmonkeyClient.isRecord(parsed)) throw new Error(`${label} must be a JSON object, not a list or a single value.`);
  return parsed;
}

function parseMeta(value: unknown): Record<string, unknown> | undefined {
  if (pdfmonkeyClient.isRecord(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return pdfmonkeyClient.isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function withFilename({ meta, filename }: { meta: Record<string, unknown> | undefined; filename: unknown }): Record<string, unknown> | undefined {
  const name = optionalText(filename);
  if (name === undefined) return meta;
  return { ...(meta ?? {}), _filename: name };
}

function createStatus(value: unknown): string {
  const status = optionalText(value) ?? 'draft';
  if (status !== 'draft' && status !== 'pending') throw new Error('Status must be "draft" or "pending".');
  return status;
}

const USER_FIELDS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'company_name',
  'current_plan',
  'current_plan_interval',
  'available_documents',
  'paying_customer',
  'share_links',
  'trial_ends_on',
  'lang',
  'created_at',
];

const HIDDEN_TEMPLATE_FIELDS = ['auth_token', 'checksum'];

export const pdfmonkeyOperations = {
  createDocument,
  updateDocument,
  getDocument,
  getDocumentCard,
  listDocuments,
  listAllDocumentCards,
  deleteDocument,
  downloadDocument,
  listTemplates,
  getTemplate,
  getCurrentUser,
  parseMeta,
  AI_MAX_WAIT_MS,
};

type DocumentCard = Record<string, unknown>;
