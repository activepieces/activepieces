import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPinchPaymentsToken, PinchPaymentsAuthCredentials } from './auth';

const BASE_URL = 'https://api.getpinch.com.au';

export async function pinchPaymentsClient(
  credentials: PinchPaymentsAuthCredentials,
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  queryParams?: Record<string, string>
) {
  const tokenResponse = await getPinchPaymentsToken(credentials);
  
  let url = `${BASE_URL}${endpoint}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url = `${url}?${params.toString()}`;
  }

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'Authorization': `Bearer ${tokenResponse.access_token}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

export interface PinchPayer {
  id?: string;
  firstName: string;
  lastName?: string;
  emailAddress: string;
  mobileNumber?: string;
  streetAddress?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  metadata?: string;
  source?: {
    sourceType: 'bank-account' | 'credit-card';
    token: string;
  };
}

export interface ListPayersParams {
  page?: number;
  pageSize?: number;
  filter?: string;
}

export async function createOrUpdatePayer(
  credentials: PinchPaymentsAuthCredentials,
  payer: PinchPayer
) {
  return pinchPaymentsClient(credentials, HttpMethod.POST, '/test/payers', payer);
}

export async function listPayers(
  credentials: PinchPaymentsAuthCredentials,
  params?: ListPayersParams
) {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams['page'] = params.page.toString();
  if (params?.pageSize) queryParams['pageSize'] = params.pageSize.toString();
  if (params?.filter) queryParams['filter'] = params.filter;

  return pinchPaymentsClient(credentials, HttpMethod.GET, '/test/payers', undefined, queryParams);
}

export interface ListPlansParams {
  page?: number;
  pageSize?: number;
}

export async function listPlans(
  credentials: PinchPaymentsAuthCredentials,
  params?: ListPlansParams
) {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams['page'] = params.page.toString();
  if (params?.pageSize) queryParams['pageSize'] = params.pageSize.toString();

  return pinchPaymentsClient(credentials, HttpMethod.GET, '/test/plans', undefined, queryParams);
}

export interface CreateSubscriptionParams {
  planId: string;
  payerId: string;
  totalAmount?: number;
  startDate?: string;
  surcharge?: string[];
  sourceId?: string;
}

export async function createSubscription(
  credentials: PinchPaymentsAuthCredentials,
  subscription: CreateSubscriptionParams
) {
  return pinchPaymentsClient(credentials, HttpMethod.POST, '/test/subscriptions', subscription);
}

export interface CreateWebhookParams {
  uri: string;
  webhookFormat?: 'pascal-case' | 'camel-case';
  eventTypes?: string[];
}

export interface WebhookResponse {
  id: string;
  uri: string;
  secret: string;
  eventTypes: string[];
}

export async function createWebhook(
  credentials: PinchPaymentsAuthCredentials,
  webhook: CreateWebhookParams
): Promise<WebhookResponse> {
  return pinchPaymentsClient(credentials, HttpMethod.POST, '/test/webhooks', webhook);
}

export async function deleteWebhook(
  credentials: PinchPaymentsAuthCredentials,
  webhookId: string
): Promise<void> {
  return pinchPaymentsClient(credentials, HttpMethod.DELETE, `/test/webhooks/${webhookId}`);
}
