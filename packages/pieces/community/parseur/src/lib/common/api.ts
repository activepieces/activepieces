import { HttpMethod } from '@activepieces/pieces-common';
import { parseurClient } from './client';
import type {
  ParseurAuthValue,
  ParseurListDocumentsResponse,
  ParseurListMailboxesResponse,
  ParseurWebhook,
  ParseurWebhookEvent,
} from './types';

async function listMailboxes({
  auth,
  ...query
}: { search?: string } & {
  auth: ParseurAuthValue;
}): Promise<ParseurListMailboxesResponse> {
  return await parseurClient.request<ParseurListMailboxesResponse>({
    auth,
    method: HttpMethod.GET,
    path: '/parser',
    query,
  });
}

async function listDocuments({
  auth,
  parserId,
  ...query
}: { parserId: string; search?: string } & {
  auth: ParseurAuthValue;
}): Promise<ParseurListDocumentsResponse> {
  return await parseurClient.request<ParseurListDocumentsResponse>({
    auth,
    method: HttpMethod.GET,
    path: `/parser/${parserId}/document_set`,
    query,
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
  mailboxId: number | undefined;
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
  createWebhook,
  enableWebhook,
  deleteWebhook,
};
