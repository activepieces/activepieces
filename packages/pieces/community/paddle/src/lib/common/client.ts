import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

import { PaddleAuthType } from '../auth';

async function validateAuth({
  apiKey,
}: {
  apiKey: string;
}): Promise<void> {
  await sendRequestWithApiKey<PaddleListResponse<PaddleCustomer>>({
    apiKey,
    method: HttpMethod.GET,
    path: '/customers',
    queryParams: {
      per_page: '1',
    },
  });
}

async function listCustomers({
  auth,
  limit = DEFAULT_PAGE_SIZE,
  email,
  status,
}: {
  auth: PaddleAuthType;
  limit?: number;
  email?: string;
  status?: PaddleCustomerStatus;
}): Promise<PaddleCustomer[]> {
  return collectPaginatedItems<PaddleCustomer>({
    auth,
    path: '/customers',
    limit,
    queryParams: {
      ...(email ? { email } : {}),
      ...(status ? { status } : {}),
    },
  });
}

async function listSubscriptions({
  auth,
  limit = DEFAULT_PAGE_SIZE,
  customerId,
  status,
}: {
  auth: PaddleAuthType;
  limit?: number;
  customerId?: string;
  status?: PaddleSubscriptionStatus;
}): Promise<PaddleSubscription[]> {
  return collectPaginatedItems<PaddleSubscription>({
    auth,
    path: '/subscriptions',
    limit,
    queryParams: {
      ...(customerId ? { customer_id: customerId } : {}),
      ...(status ? { status } : {}),
    },
  });
}

async function listPrices({
  auth,
  limit = DEFAULT_PAGE_SIZE,
  recurring = true,
}: {
  auth: PaddleAuthType;
  limit?: number;
  recurring?: boolean;
}): Promise<PaddlePrice[]> {
  return collectPaginatedItems<PaddlePrice>({
    auth,
    path: '/prices',
    limit,
    queryParams: {
      status: 'active',
      ...(recurring ? { recurring: 'true' } : {}),
    },
  });
}

async function getSubscription({
  auth,
  subscriptionId,
}: {
  auth: PaddleAuthType;
  subscriptionId: string;
}): Promise<PaddleSubscription> {
  const response = await sendRequest<PaddleEntityResponse<PaddleSubscription>>({
    auth,
    method: HttpMethod.GET,
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  });

  return response.data;
}

async function updateSubscription({
  auth,
  subscriptionId,
  request,
}: {
  auth: PaddleAuthType;
  subscriptionId: string;
  request: Record<string, unknown>;
}): Promise<PaddleSubscription> {
  const response = await sendRequest<PaddleEntityResponse<PaddleSubscription>>({
    auth,
    method: HttpMethod.PATCH,
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    body: request,
  });

  return response.data;
}

async function listAddresses({
  auth,
  customerId,
}: {
  auth: PaddleAuthType;
  customerId: string;
}): Promise<Array<{ id: string }>> {
  const response = await sendRequest<PaddleListResponse<{ id: string }>>({
    auth,
    method: HttpMethod.GET,
    path: `/customers/${encodeURIComponent(customerId)}/addresses`,
  });

  return response.data;
}

async function createNotificationSetting({
  auth,
  url,
  subscribedEvents,
}: {
  auth: PaddleAuthType;
  url: string;
  subscribedEvents: string[];
}): Promise<{ id: string }> {
  const response = await sendRequest<PaddleEntityResponse<{ id: string }>>({
    auth,
    method: HttpMethod.POST,
    path: '/notification-settings',
    body: {
      type: 'url',
      destination: url,
      subscribed_events: subscribedEvents,
      active: true,
      description:"Activepieces"
    },
  });

  return response.data;
}

async function deleteNotificationSetting({
  auth,
  notificationSettingId,
}: {
  auth: PaddleAuthType;
  notificationSettingId: string;
}): Promise<void> {
  await sendRequest<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/notification-settings/${encodeURIComponent(notificationSettingId)}`,
  });
}


async function cancelSubscription({
  auth,
  subscriptionId,
  request,
}: {
  auth: PaddleAuthType;
  subscriptionId: string;
  request: Record<string, unknown>;
}): Promise<PaddleSubscription> {
  const response = await sendRequest<PaddleEntityResponse<PaddleSubscription>>({
    auth,
    method: HttpMethod.POST,
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    body: request,
  });

  return response.data;
}

async function createTransaction({
  auth,
  request,
}: {
  auth: PaddleAuthType;
  request: Record<string, unknown>;
}): Promise<PaddleTransaction> {
  const response = await sendRequest<PaddleEntityResponse<PaddleTransaction>>({
    auth,
    method: HttpMethod.POST,
    path: '/transactions',
    body: request,
  });

  return response.data;
}

function getBaseUrl({
  apiKey,
}: {
  apiKey: string;
}): string {
  return apiKey.includes('_sdbx_')
    ? PADDLE_SANDBOX_API_BASE_URL
    : PADDLE_LIVE_API_BASE_URL;
}

async function collectPaginatedItems<TItem>({
  auth,
  path,
  limit,
  queryParams,
}: {
  auth: PaddleAuthType;
  path: string;
  limit: number;
  queryParams?: PaddleQueryParams;
}): Promise<TItem[]> {
  const items: TItem[] = [];
  let after: string | undefined;

  while (items.length < limit) {
    const response = await sendRequest<PaddleListResponse<TItem>>({
      auth,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        per_page: String(Math.min(limit - items.length, PADDLE_MAX_PAGE_SIZE)),
        ...(after ? { after } : {}),
      },
    });

    items.push(...response.data);

    const nextAfter = getNextAfter({
      nextUrl: response.meta?.pagination?.next ?? null,
    });

    if (!nextAfter || response.data.length === 0) {
      break;
    }

    after = nextAfter;
  }

  return items;
}

async function sendRequest<TResponse>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: PaddleAuthType;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: PaddleQueryParams;
}): Promise<TResponse> {
  return sendRequestWithApiKey<TResponse>({
    apiKey: auth.secret_text,
    method,
    path,
    body,
    queryParams,
  });
}

async function sendRequestWithApiKey<TResponse>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: PaddleQueryParams;
}): Promise<TResponse> {
  const request: HttpRequest<Record<string, unknown>> = {
    method,
    url: `${getBaseUrl({ apiKey })}${path}`,
    headers: buildHeaders({
      apiKey,
    }),
    ...(body ? { body } : {}),
    ...(queryParams ? { queryParams } : {}),
  };

  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

function buildHeaders({
  apiKey,
}: {
  apiKey: string;
}): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Paddle-Version': '1',
  };
}

function getNextAfter({
  nextUrl,
}: {
  nextUrl: string | null;
}): string | undefined {
  if (!nextUrl) {
    return undefined;
  }

  return new URL(nextUrl).searchParams.get('after') ?? undefined;
}

const DEFAULT_PAGE_SIZE = 100;
const PADDLE_MAX_PAGE_SIZE = 200;
const PADDLE_LIVE_API_BASE_URL = 'https://api.paddle.com';
const PADDLE_SANDBOX_API_BASE_URL = 'https://sandbox-api.paddle.com';

const paddleClient = {
  cancelSubscription,
  createNotificationSetting,
  createTransaction,
  deleteNotificationSetting,
  getBaseUrl,
  getSubscription,
  listAddresses,
  listCustomers,
  listPrices,
  listSubscriptions,
  updateSubscription,
  validateAuth,
};

type PaddleQueryParams = Record<string, string>;

type PaddleEntityResponse<TData> = {
  data: TData;
};

type PaddleListResponse<TData> = {
  data: TData[];
  meta?: {
    pagination?: {
      next: string | null;
    };
  };
};

type PaddleCustomer = {
  id: string;
  name?: string | null;
  email?: string | null;
  status?: PaddleCustomerStatus;
};

type PaddlePrice = {
  id: string;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  unit_price?: {
    amount?: string | null;
    currency_code?: string | null;
  };
};

type PaddleSubscription = {
  id: string;
  customer_id?: string | null;
  status?: PaddleSubscriptionStatus;
  items?: Array<{
    price?: {
      id?: string | null;
      name?: string | null;
    };
    quantity?: number | null;
  }>;
};

type PaddleTransaction = {
  id: string;
  status?: string | null;
  checkout?: {
    url?: string | null;
  } | null;
};

type PaddleCustomerStatus = 'active' | 'archived';

type PaddleSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'paused'
  | 'trialing';

export { paddleClient };
