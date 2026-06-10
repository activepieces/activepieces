import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

import {
  KustomerJsonObject,
  KustomerJsonValue,
  KustomerQueryParams,
} from './types';

async function validateAuth({
  apiKey,
}: {
  apiKey: string;
}): Promise<void> {
  await sendRequest({
    apiKey,
    method: HttpMethod.GET,
    path: '/customers',
  });
}

async function createCustomer({
  apiKey,
  customer,
}: {
  apiKey: string;
  customer: KustomerJsonObject;
}): Promise<KustomerJsonValue> {
  return sendRequest({
    apiKey,
    method: HttpMethod.POST,
    path: '/customers',
    body: customer,
  });
}

async function createConversation({
  apiKey,
  conversation,
}: {
  apiKey: string;
  conversation: KustomerJsonObject;
}): Promise<KustomerJsonValue> {
  return sendRequest({
    apiKey,
    method: HttpMethod.POST,
    path: '/conversations',
    body: conversation,
  });
}

async function updateConversation({
  apiKey,
  conversationId,
  updates,
}: {
  apiKey: string;
  conversationId: string;
  updates: KustomerJsonObject;
}): Promise<KustomerJsonValue> {
  return sendRequest({
    apiKey,
    method: HttpMethod.PUT,
    path: `/conversations/${encodeURIComponent(conversationId)}`,
    body: updates,
  });
}

async function getCustomer({
  apiKey,
  customerId,
}: {
  apiKey: string;
  customerId: string;
}): Promise<KustomerJsonValue> {
  return sendRequest({
    apiKey,
    method: HttpMethod.GET,
    path: `/customers/${encodeURIComponent(customerId)}`,
  });
}

async function getCustomObjects({
  apiKey,
  klassName,
  fromDate,
}: {
  apiKey: string;
  klassName: string;
  fromDate?: string;
}): Promise<KustomerJsonValue> {
  return sendRequest({
    apiKey,
    method: HttpMethod.GET,
    path: `/kobjects/${encodeURIComponent(klassName)}`,
    ...(fromDate ? { queryParams: { fromDate } } : {}),
  });
}

function createAuthHeaders({
  apiKey,
}: {
  apiKey: string;
}): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function sendRequest({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: KustomerJsonObject;
  queryParams?: KustomerQueryParams;
}): Promise<KustomerJsonValue> {
  const request: HttpRequest<KustomerJsonObject> = {
    method,
    url: `${KUSTOMER_API_BASE_URL}${path}`,
    headers: createAuthHeaders({
      apiKey,
    }),
    ...(body ? { body } : {}),
    ...(queryParams ? { queryParams } : {}),
  };
  const response = await httpClient.sendRequest<KustomerJsonValue>(request);

  return response.body;
}

export const kustomerClient = {
  validateAuth,
  createCustomer,
  createConversation,
  updateConversation,
  getCustomer,
  getCustomObjects,
  createAuthHeaders,
};

export const KUSTOMER_API_BASE_URL = 'https://api.kustomerapp.com/v1';
