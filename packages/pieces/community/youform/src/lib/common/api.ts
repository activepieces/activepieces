import { HttpMethod } from '@activepieces/pieces-common';

import { youformClient } from './client';

import type {
  YouformAuthValue,
  YouformCreateWebhookResponse,
  YouformForm,
  YouformPage,
  YouformUser,
} from './types';

async function getMe({
  auth,
}: {
  auth: YouformAuthValue;
}): Promise<{ data: YouformUser }> {
  return await youformClient.request<{ data: YouformUser }>({
    auth,
    method: HttpMethod.GET,
    path: '/me',
  });
}

async function listForms({
  auth,
}: {
  auth: YouformAuthValue;
}): Promise<YouformPage<YouformForm>> {
  return await youformClient.request<YouformPage<YouformForm>>({
    auth,
    method: HttpMethod.GET,
    path: '/forms',
  });
}

async function createWebhook({
  auth,
  formId,
  webhookUrl,
}: {
  auth: YouformAuthValue;
  formId: string;
  webhookUrl: string;
}): Promise<YouformCreateWebhookResponse> {
  return await youformClient.request<YouformCreateWebhookResponse>({
    auth,
    method: HttpMethod.POST,
    path: '/webhooks',
    body: {},
    query: {
      form_id: formId,
      webhook_url: webhookUrl,
    },
  });
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: YouformAuthValue;
  webhookId: number;
}): Promise<void> {
  await youformClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/webhooks/${webhookId}`,
  });
}

export const youformApi = { getMe, listForms, createWebhook, deleteWebhook };
