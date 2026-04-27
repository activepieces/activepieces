import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const SHOPSAVVY_API_URL = 'https://api.shopsavvy.com/v1';

export async function validateShopSavvyAuth(
  apiKey: string,
): Promise<void> {
  await sendRequest<{ success: boolean }>({
    apiKey,
    method: HttpMethod.GET,
    path: '/usage',
  });
}

export async function searchProducts({
  apiKey,
  query,
  limit,
}: {
  apiKey: string;
  query: string;
  limit?: number;
}): Promise<ShopSavvySearchResponse> {
  const queryParams: Record<string, string> = { q: query };
  if (limit !== undefined) {
    queryParams['limit'] = String(limit);
  }
  return sendRequest<ShopSavvySearchResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/products/search',
    queryParams,
  });
}

export async function getProductDetails({
  apiKey,
  identifier,
}: {
  apiKey: string;
  identifier: string;
}): Promise<ShopSavvyProductResponse> {
  return sendRequest<ShopSavvyProductResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/products',
    queryParams: { ids: identifier },
  });
}

export async function getCurrentOffers({
  apiKey,
  identifier,
  retailer,
}: {
  apiKey: string;
  identifier: string;
  retailer?: string;
}): Promise<ShopSavvyOffersResponse> {
  const queryParams: Record<string, string> = { ids: identifier };
  if (retailer) {
    queryParams['retailer'] = retailer;
  }
  return sendRequest<ShopSavvyOffersResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/products/offers',
    queryParams,
  });
}

export async function getPriceHistory({
  apiKey,
  identifier,
  startDate,
  endDate,
  retailer,
}: {
  apiKey: string;
  identifier: string;
  startDate: string;
  endDate: string;
  retailer?: string;
}): Promise<ShopSavvyPriceHistoryResponse> {
  const queryParams: Record<string, string> = {
    ids: identifier,
    start_date: startDate,
    end_date: endDate,
  };
  if (retailer) {
    queryParams['retailer'] = retailer;
  }
  return sendRequest<ShopSavvyPriceHistoryResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/products/offers/history',
    queryParams,
  });
}

async function sendRequest<TResponse>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
}): Promise<TResponse> {
  const request: HttpRequest<Record<string, unknown>> = {
    method,
    url: `${SHOPSAVVY_API_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };
  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

// Types

export type ShopSavvyProduct = {
  title: string;
  shopsavvy: string;
  brand?: string | null;
  category?: string | null;
  barcode?: string | null;
  amazon?: string | null;
  model?: string | null;
  description?: string | null;
  images?: string[] | null;
  rating?: { value: number; count: number } | null;
  attributes?: Record<string, string> | null;
};

export type ShopSavvyOffer = {
  id: string;
  retailer?: string | null;
  price?: number | null;
  currency?: string | null;
  availability?: string | null;
  condition?: string | null;
  URL?: string | null;
  seller?: string | null;
  timestamp?: string | null;
};

export type ShopSavvyProductWithOffers = ShopSavvyProduct & {
  offers: ShopSavvyOffer[];
};

export type ShopSavvyOfferWithHistory = ShopSavvyOffer & {
  history?: { date: string; price: number; availability: string }[];
};

export type ShopSavvySearchResponse = {
  success: boolean;
  data: ShopSavvyProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    returned: number;
  };
  meta?: { credits_used: number; credits_remaining: number };
};

export type ShopSavvyProductResponse = {
  success: boolean;
  data: ShopSavvyProduct[];
  meta?: { credits_used: number; credits_remaining: number };
};

export type ShopSavvyOffersResponse = {
  success: boolean;
  data: ShopSavvyProductWithOffers[];
  meta?: { credits_used: number; credits_remaining: number };
};

export type ShopSavvyPriceHistoryResponse = {
  success: boolean;
  data: ShopSavvyOfferWithHistory[];
  meta?: { credits_used: number; credits_remaining: number };
};
