import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export function getLemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}

/**
 * Builds a query string that preserves bracket characters in parameter names.
 * URLSearchParams percent-encodes brackets (e.g. filter[store_id] becomes
 * filter%5Bstore_id%5D), which some JSON:API servers reject.
 */
export function buildQueryString(params: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export async function fetchStoreOptions(apiKey: string): Promise<{ label: string; value: string }[]> {
  const response = await httpClient.sendRequest<{ data: { id: string; attributes: { name: string } }[] }>({
    method: HttpMethod.GET,
    url: `${LEMON_SQUEEZY_API_BASE}/stores?page[size]=100`,
    headers: getLemonSqueezyHeaders(apiKey),
  });
  return response.body.data.map((store) => ({
    label: store.attributes.name,
    value: store.id,
  }));
}

export async function fetchOrderOptions(
  apiKey: string,
  storeId?: string,
): Promise<{ label: string; value: string }[]> {
  const params: Record<string, string> = { 'page[size]': '100' };
  if (storeId) params['filter[store_id]'] = storeId;
  const response = await httpClient.sendRequest<{
    data: { id: string; attributes: { order_number: number; user_name: string; status_formatted: string } }[];
  }>({
    method: HttpMethod.GET,
    url: `${LEMON_SQUEEZY_API_BASE}/orders${buildQueryString(params)}`,
    headers: getLemonSqueezyHeaders(apiKey),
  });
  return response.body.data.map((order) => ({
    label: `#${order.attributes.order_number} — ${order.attributes.user_name} (${order.attributes.status_formatted})`,
    value: order.id,
  }));
}

export async function fetchProductOptions(
  apiKey: string,
  storeId?: string,
): Promise<{ label: string; value: string }[]> {
  const params: Record<string, string> = { 'page[size]': '100' };
  if (storeId) params['filter[store_id]'] = storeId;
  const response = await httpClient.sendRequest<{
    data: { id: string; attributes: { name: string } }[];
  }>({
    method: HttpMethod.GET,
    url: `${LEMON_SQUEEZY_API_BASE}/products${buildQueryString(params)}`,
    headers: getLemonSqueezyHeaders(apiKey),
  });
  return response.body.data.map((product) => ({
    label: product.attributes.name,
    value: product.id,
  }));
}

export async function fetchVariantOptions(
  apiKey: string,
  productId?: string,
): Promise<{ label: string; value: string }[]> {
  const params: Record<string, string> = { 'page[size]': '100' };
  if (productId) params['filter[product_id]'] = productId;
  const response = await httpClient.sendRequest<{
    data: { id: string; attributes: { name: string } }[];
  }>({
    method: HttpMethod.GET,
    url: `${LEMON_SQUEEZY_API_BASE}/variants${buildQueryString(params)}`,
    headers: getLemonSqueezyHeaders(apiKey),
  });
  return response.body.data.map((variant) => ({
    label: variant.attributes.name,
    value: variant.id,
  }));
}
