import {
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

import { youformClient } from './client';

import type {
  YouformAuthValue,
  YouformCreateWebhookResponse,
  YouformForm,
  YouformFormDetail,
  YouformPage,
  YouformPaginator,
  YouformSubmission,
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
  page,
}: {
  auth: YouformAuthValue;
  page?: number;
}): Promise<YouformPage<YouformForm>> {
  return await youformClient.request<YouformPage<YouformForm>>({
    auth,
    method: HttpMethod.GET,
    path: '/forms',
    query: page !== undefined ? { page: String(page) } : undefined,
  });
}

async function getForm({
  auth,
  formSlug,
}: {
  auth: YouformAuthValue;
  formSlug: string;
}): Promise<YouformFormDetail | null> {
  try {
    const response = await youformClient.request<{ data: YouformFormDetail }>({
      auth,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(formSlug)}`,
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

async function listSubmissions({
  auth,
  formSlug,
  page,
  limit,
  sortOrder,
  isComplete,
}: ListSubmissionsParams & {
  auth: YouformAuthValue;
}): Promise<YouformPaginator<YouformSubmission>> {
  const query: QueryParams = {};
  if (page !== undefined) {
    query['page'] = String(page);
  }
  if (limit !== undefined) {
    query['per_page'] = String(limit);
  }
  if (sortOrder !== undefined) {
    query['sort_by'] = 'created_at';
    query['sort_by_order'] = sortOrder;
  }
  if (isComplete !== undefined) {
    query['is_complete'] = isComplete;
  }
  const response = await youformClient.request<YouformPage<YouformSubmission>>({
    auth,
    method: HttpMethod.GET,
    path: `/forms/${encodeURIComponent(formSlug)}/submissions`,
    query,
  });
  return response.data;
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

export const youformApi = {
  getMe,
  listForms,
  getForm,
  listSubmissions,
  createWebhook,
  deleteWebhook,
};

type ListSubmissionsParams = {
  formSlug: string;
  page?: number;
  limit?: number;
  sortOrder?: string;
  isComplete?: string;
};
