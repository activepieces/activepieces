import { HttpMethod } from '@activepieces/pieces-common';
import { ApFile } from '@activepieces/pieces-framework';
import { parseurClient } from './client';
import { parseurUtils } from './utils';
import type {
  ParseurAuthValue,
  ParseurCreateDocumentFromFileResponse,
  ParseurCreateDocumentResponse,
  ParseurDocument,
  ParseurEmailDocument,
  ParseurListDocumentsResponse,
  ParseurListMailboxesResponse,
  ParseurListQuery,
  ParseurNotificationResponse,
  ParseurWebhook,
  ParseurWebhookEvent,
} from './types';

async function listMailboxes({
  auth,
  query,
}: {
  auth: ParseurAuthValue;
  query: ParseurListQuery;
}): Promise<ParseurListMailboxesResponse> {
  return await parseurClient.request<ParseurListMailboxesResponse>({
    auth,
    method: HttpMethod.GET,
    path: '/parser',
    query: parseurUtils.definedQuery({ query }),
  });
}

async function listDocuments({
  auth,
  parserId,
  query,
}: {
  auth: ParseurAuthValue;
  parserId: string;
  query: ParseurListQuery;
}): Promise<ParseurListDocumentsResponse> {
  return await parseurClient.request<ParseurListDocumentsResponse>({
    auth,
    method: HttpMethod.GET,
    path: `/parser/${parserId}/document_set`,
    query: parseurUtils.definedQuery({ query }),
  });
}

async function getDocument({
  auth,
  documentId,
}: {
  auth: ParseurAuthValue;
  documentId: string;
}): Promise<ParseurDocument> {
  return await parseurClient.request<ParseurDocument>({
    auth,
    method: HttpMethod.GET,
    path: `/document/${documentId}`,
  });
}

async function createEmailDocument({
  auth,
  document,
}: {
  auth: ParseurAuthValue;
  document: ParseurEmailDocument;
}): Promise<ParseurCreateDocumentResponse> {
  return await parseurClient.request<ParseurCreateDocumentResponse>({
    auth,
    method: HttpMethod.POST,
    path: '/email',
    body: document,
  });
}

async function uploadDocumentFile({
  auth,
  parserId,
  file,
}: {
  auth: ParseurAuthValue;
  parserId: string;
  file: ApFile;
}): Promise<ParseurCreateDocumentFromFileResponse> {
  const data = new FormData();
  const uint8 = new Uint8Array(file.data);
  data.append('file', new Blob([uint8]), file.filename);
  data.append('parserId', parserId);
  return await parseurClient.request<ParseurCreateDocumentFromFileResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/parser/${parserId}/upload`,
    headers: { 'Content-Type': 'multipart/form-data' },
    body: data,
  });
}

async function reprocessDocument({
  auth,
  documentId,
}: {
  auth: ParseurAuthValue;
  documentId: string;
}): Promise<ParseurNotificationResponse> {
  return await parseurClient.request<ParseurNotificationResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/document/${documentId}/process`,
  });
}

async function createWebhook({
  auth,
  event,
  target,
}: {
  auth: ParseurAuthValue;
  event: ParseurWebhookEvent;
  target: string;
}): Promise<ParseurWebhook> {
  return await parseurClient.request<ParseurWebhook>({
    auth,
    method: HttpMethod.POST,
    path: '/webhook',
    body: { event, target, category: 'CUSTOM' },
  });
}

async function enableWebhook({
  auth,
  webhookId,
  mailboxId,
}: {
  auth: ParseurAuthValue;
  webhookId: number;
  mailboxId: number;
}): Promise<void> {
  await parseurClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/parser/${mailboxId}/webhook_set/${webhookId}`,
  });
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: ParseurAuthValue;
  webhookId: number;
}): Promise<void> {
  await parseurClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/webhook/${webhookId}`,
  });
}

export const parseurApi = {
  listMailboxes,
  listDocuments,
  getDocument,
  createEmailDocument,
  uploadDocumentFile,
  reprocessDocument,
  createWebhook,
  enableWebhook,
  deleteWebhook,
};
