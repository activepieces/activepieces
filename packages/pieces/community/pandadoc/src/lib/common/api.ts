import { HttpMethod } from '@activepieces/pieces-common';
import { encodeId, isPandaDocStatus, pandadocDownload, pandadocRequest, PandaDocQuery, sanitizeFileName } from './client';
import { pandadocNormalize } from './normalize';

async function getJson({ apiKey, path, query }: { apiKey: string; path: string; query?: PandaDocQuery }): Promise<unknown> {
  const response = await pandadocRequest<unknown>({ apiKey, method: HttpMethod.GET, path, query });
  return response.body;
}

async function send({ apiKey, method, path, body, query, flag }: { apiKey: string; method: HttpMethod; path: string; body?: unknown; query?: PandaDocQuery; flag?: string }): Promise<unknown> {
  const response = await pandadocRequest<unknown>({ apiKey, method, path, body, query, flag });
  return response.body;
}

async function getDocumentStatus({ apiKey, documentId }: { apiKey: string; documentId: string }) {
  const body = await getJson({ apiKey, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}` });
  return pandadocNormalize.documentSummary(body);
}

async function waitUntilReady({ apiKey, documentId, timeoutMs = WAIT_TIMEOUT_MS }: { apiKey: string; documentId: string; timeoutMs?: number }) {
  const deadline = Date.now() + timeoutMs;
  let delay = FIRST_POLL_DELAY_MS;
  for (;;) {
    await sleep(delay);
    const status = await getDocumentStatus({ apiKey, documentId });
    if (status.status !== 'document.uploaded') {
      if (status.status === 'document.error') {
        throw new Error(`PandaDoc could not process document ${documentId} (status document.error). Check the file or template and the field values.`);
      }
      return status;
    }
    if (Date.now() + delay > deadline) {
      throw new Error(
        `Document ${documentId} is still being processed by PandaDoc after ${Math.round(timeoutMs / 1000)} seconds. It was created; check its status later with Get Document.`,
      );
    }
    delay = Math.min(delay * 2, MAX_POLL_DELAY_MS);
  }
}

async function createDocumentRaw({ apiKey, body, waitForDraft }: { apiKey: string; body: unknown; waitForDraft: boolean }): Promise<Record<string, unknown>> {
  const created = pandadocNormalize.rec(await send({ apiKey, method: HttpMethod.POST, path: '/documents', body }));
  const id = pandadocNormalize.str(created['id']);
  if (!waitForDraft || id === null) {
    return created;
  }
  const ready = await waitUntilReady({ apiKey, documentId: id });
  return { ...created, status: ready.status, date_modified: ready.date_modified, version: ready.version };
}

async function createDocument({ apiKey, body, waitForDraft }: { apiKey: string; body: unknown; waitForDraft: boolean }) {
  const created = pandadocNormalize.documentSummary(await send({ apiKey, method: HttpMethod.POST, path: '/documents', body }));
  if (!waitForDraft || created.id === null) {
    return created;
  }
  const ready = await waitUntilReady({ apiKey, documentId: created.id });
  return { ...created, ...ready };
}

async function createDocumentFromUpload({
  apiKey,
  file,
  data,
  waitForDraft,
}: {
  apiKey: string;
  file: UploadFile;
  data: Record<string, unknown>;
  waitForDraft: boolean;
}) {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file.data)], { type: file.contentType }), file.fileName);
  form.append('data', JSON.stringify(data));
  const created = pandadocNormalize.documentSummary(await send({ apiKey, method: HttpMethod.POST, path: '/documents', flag: 'upload', body: form }));
  if (!waitForDraft || created.id === null) {
    return created;
  }
  const ready = await waitUntilReady({ apiKey, documentId: created.id });
  return { ...created, ...ready };
}

async function getDocumentDetailsRaw({ apiKey, documentId }: { apiKey: string; documentId: string }): Promise<unknown> {
  return getJson({ apiKey, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/details` });
}

async function getDocumentDetails({ apiKey, documentId }: { apiKey: string; documentId: string }) {
  return pandadocNormalize.documentDetails(await getDocumentDetailsRaw({ apiKey, documentId }));
}

async function listDocumentsRaw({ apiKey, query }: { apiKey: string; query: PandaDocQuery }): Promise<unknown> {
  return getJson({ apiKey, path: '/documents', query });
}

async function listDocuments({ apiKey, query }: { apiKey: string; query: PandaDocQuery }) {
  const body = pandadocNormalize.rec(await listDocumentsRaw({ apiKey, query }));
  const documents = pandadocNormalize.list(body['results']).map(pandadocNormalize.documentSummary);
  return { documents, count: documents.length };
}

async function sendDocument({ apiKey, documentId, body }: { apiKey: string; documentId: string; body: Record<string, unknown> }) {
  const response = await send({ apiKey, method: HttpMethod.POST, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/send`, body });
  const doc = pandadocNormalize.rec(response);
  return {
    ...pandadocNormalize.documentSummary(doc),
    recipients: pandadocNormalize.list(doc['recipients']).map(pandadocNormalize.recipient),
  };
}

async function createSigningLink({ apiKey, documentId, recipient, lifetime }: { apiKey: string; documentId: string; recipient: string; lifetime: number | undefined }) {
  const response = pandadocNormalize.rec(
    await send({
      apiKey,
      method: HttpMethod.POST,
      path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/session`,
      body: lifetime === undefined ? { recipient } : { recipient, lifetime },
    }),
  );
  const sessionId = pandadocNormalize.str(response['id']);
  return {
    session_id: sessionId,
    url: sessionId === null ? null : `https://app.pandadoc.com/s/${encodeURIComponent(sessionId)}`,
    expires_at: pandadocNormalize.str(response['expires_at']),
    document_id: documentId,
    recipient_email: recipient,
  };
}

async function sendReminder({ apiKey, documentId, body }: { apiKey: string; documentId: string; body: Record<string, unknown> }) {
  const response = pandadocNormalize.rec(
    await send({ apiKey, method: HttpMethod.POST, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/send-reminder`, body }),
  );
  const results = pandadocNormalize.list(response['result']).map((item) => {
    const r = pandadocNormalize.rec(item);
    const email = pandadocNormalize.rec(r['email']);
    const sms = pandadocNormalize.rec(r['sms']);
    return {
      recipient_id: pandadocNormalize.str(r['recipient_id']),
      email_status: pandadocNormalize.str(email['status']),
      email_detail: pandadocNormalize.str(email['detail']),
      sms_status: pandadocNormalize.str(sms['status']),
      sms_detail: pandadocNormalize.str(sms['detail']),
    };
  });
  return { document_id: documentId, results };
}

async function changeDocumentStatus({ apiKey, documentId, body }: { apiKey: string; documentId: string; body: Record<string, unknown> }) {
  await send({ apiKey, method: HttpMethod.PATCH, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/status`, body });
}

async function deleteDocument({ apiKey, documentId }: { apiKey: string; documentId: string }) {
  try {
    await send({ apiKey, method: HttpMethod.DELETE, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}` });
    return { deleted: true, already_deleted: false, id: documentId };
  } catch (error) {
    if (isPandaDocStatus({ error, statuses: [404] })) {
      return { deleted: true, already_deleted: true, id: documentId };
    }
    if (isPandaDocStatus({ error, statuses: [403] })) {
      throw new Error(
        `PandaDoc refused to delete document ${documentId} (HTTP 403). It is either already deleted (PandaDoc answers 403 for documents in the trash) or the API key's user cannot access it.`,
      );
    }
    throw error;
  }
}

async function moveDocumentToFolder({ apiKey, documentId, folderId }: { apiKey: string; documentId: string; folderId: string }) {
  await send({
    apiKey,
    method: HttpMethod.POST,
    path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/move-to-folder/${encodeId({ id: folderId, label: 'Folder ID' })}`,
  });
  return { id: documentId, folder_id: folderId, moved: true };
}

async function addRecipient({ apiKey, documentId, contactId }: { apiKey: string; documentId: string; contactId: string }) {
  const response = pandadocNormalize.rec(
    await send({
      apiKey,
      method: HttpMethod.POST,
      path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/recipients`,
      body: { id: contactId, kind: 'contact' },
    }),
  );
  return { document_id: documentId, contact_id: contactId, recipient_id: pandadocNormalize.str(response['recipient_id']) };
}

async function listDocumentFields({ apiKey, documentId }: { apiKey: string; documentId: string }) {
  const response = pandadocNormalize.rec(await getJson({ apiKey, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/fields` }));
  const fields = pandadocNormalize.list(response['fields']).map(pandadocNormalize.field);
  return { document_id: documentId, fields, count: fields.length };
}

async function listTemplates({ apiKey, query }: { apiKey: string; query: PandaDocQuery }) {
  const body = pandadocNormalize.rec(await getJson({ apiKey, path: '/templates', query }));
  const templates = pandadocNormalize.list(body['results']).map(pandadocNormalize.templateSummary);
  return { templates, count: templates.length };
}

async function getTemplateDetailsRaw({ apiKey, templateId }: { apiKey: string; templateId: string }): Promise<unknown> {
  return getJson({ apiKey, path: `/templates/${encodeId({ id: templateId, label: 'Template ID' })}/details` });
}

async function getTemplateDetails({ apiKey, templateId }: { apiKey: string; templateId: string }) {
  return pandadocNormalize.templateDetails(await getTemplateDetailsRaw({ apiKey, templateId }));
}

async function listFolders({ apiKey, query }: { apiKey: string; query: PandaDocQuery }) {
  const body = pandadocNormalize.rec(await getJson({ apiKey, path: '/documents/folders', query }));
  const folders = pandadocNormalize.list(body['results']).map(pandadocNormalize.folder);
  return { folders, count: folders.length };
}

async function createFolder({ apiKey, name, parentId }: { apiKey: string; name: string; parentId: string | undefined }) {
  const body = await send({ apiKey, method: HttpMethod.POST, path: '/documents/folders', body: parentId ? { name, parent_uuid: parentId } : { name } });
  return { ...pandadocNormalize.folder(body), parent_uuid: parentId ?? null };
}

async function listContacts({ apiKey, email }: { apiKey: string; email: string | undefined }) {
  const body = pandadocNormalize.rec(await getJson({ apiKey, path: '/contacts', query: { email } }));
  const contacts = pandadocNormalize.list(body['results']).map(pandadocNormalize.contact);
  return { contacts, count: contacts.length };
}

async function createContactRaw({ apiKey, body }: { apiKey: string; body: Record<string, unknown> }): Promise<unknown> {
  return send({ apiKey, method: HttpMethod.POST, path: '/contacts', body });
}

async function updateContactRaw({ apiKey, contactId, body }: { apiKey: string; contactId: string; body: Record<string, unknown> }): Promise<unknown> {
  return send({ apiKey, method: HttpMethod.PATCH, path: `/contacts/${encodeId({ id: contactId, label: 'Contact ID' })}`, body });
}

async function deleteContact({ apiKey, contactId }: { apiKey: string; contactId: string }) {
  try {
    await send({ apiKey, method: HttpMethod.DELETE, path: `/contacts/${encodeId({ id: contactId, label: 'Contact ID' })}` });
    return { deleted: true, already_deleted: false, id: contactId };
  } catch (error) {
    if (isPandaDocStatus({ error, statuses: [404] })) {
      return { deleted: true, already_deleted: true, id: contactId };
    }
    throw error;
  }
}

async function listAttachmentsRaw({ apiKey, documentId }: { apiKey: string; documentId: string }): Promise<unknown> {
  return getJson({ apiKey, path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/attachments` });
}

async function listAttachments({ apiKey, documentId }: { apiKey: string; documentId: string }) {
  const attachments = pandadocNormalize.list(await listAttachmentsRaw({ apiKey, documentId })).map(pandadocNormalize.attachment);
  return { document_id: documentId, attachments, count: attachments.length };
}

async function getAttachmentRaw({ apiKey, documentId, attachmentId }: { apiKey: string; documentId: string; attachmentId: string }): Promise<unknown> {
  return getJson({
    apiKey,
    path: `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/attachments/${encodeId({ id: attachmentId, label: 'Attachment ID' })}`,
  });
}

async function createAttachmentRaw({
  apiKey,
  documentId,
  url,
  file,
  name,
}: {
  apiKey: string;
  documentId: string;
  url: string | undefined;
  file: UploadFile | undefined;
  name: string | undefined;
}): Promise<unknown> {
  const path = `/documents/${encodeId({ id: documentId, label: 'Document ID' })}/attachments`;
  if (file !== undefined) {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.data)], { type: file.contentType }), file.fileName);
    if (name) {
      form.append('name', name);
    }
    return send({ apiKey, method: HttpMethod.POST, path, flag: 'upload', body: form });
  }
  if (!url) {
    throw new Error('Provide either a File URL or a File to attach.');
  }
  return send({ apiKey, method: HttpMethod.POST, path, body: name ? { source: url, name } : { source: url } });
}

async function downloadDocument({
  apiKey,
  documentId,
  protectedCopy,
  query,
}: {
  apiKey: string;
  documentId: string;
  protectedCopy: boolean;
  query: PandaDocQuery;
}) {
  const id = encodeId({ id: documentId, label: 'Document ID' });
  const result = await pandadocDownload({ apiKey, path: `/documents/${id}/${protectedCopy ? 'download-protected' : 'download'}`, query });
  const isZip = result.contentType?.includes('zip') === true || query['separate_files'] === true;
  const extension = isZip ? 'zip' : 'pdf';
  const fallback = `${documentId}.${extension}`;
  const fromHeader = result.fileName;
  const fileName = fromHeader === null ? fallback : fromHeader.toLowerCase().endsWith(`.${extension}`) ? fromHeader : `${fromHeader}.${extension}`;
  return { data: result.data, fileName: sanitizeFileName(fileName) ?? fallback, contentType: result.contentType };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const pandadocApi = {
  getDocumentStatus,
  waitUntilReady,
  createDocumentRaw,
  createDocument,
  createDocumentFromUpload,
  getDocumentDetailsRaw,
  getDocumentDetails,
  listDocumentsRaw,
  listDocuments,
  sendDocument,
  createSigningLink,
  sendReminder,
  changeDocumentStatus,
  deleteDocument,
  moveDocumentToFolder,
  addRecipient,
  listDocumentFields,
  listTemplates,
  getTemplateDetailsRaw,
  getTemplateDetails,
  listFolders,
  createFolder,
  listContacts,
  createContactRaw,
  updateContactRaw,
  deleteContact,
  listAttachmentsRaw,
  listAttachments,
  getAttachmentRaw,
  createAttachmentRaw,
  downloadDocument,
};

export type UploadFile = { data: Buffer; fileName: string; contentType: string };

const WAIT_TIMEOUT_MS = 90000;
const FIRST_POLL_DELAY_MS = 3000;
const MAX_POLL_DELAY_MS = 20000;
