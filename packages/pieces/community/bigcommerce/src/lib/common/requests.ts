import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bigCommerceAuth, GET_BASE_URL } from './constants';

async function fireHttpRequest({
  method,
  path,
  body,
  auth,
  filter = false,
}: {
  method: HttpMethod;
  path: string;
  auth: bigCommerceAuth;
  body?: unknown;
  filter?: boolean;
}) {
  const BASE_URL = GET_BASE_URL(auth.storeHash);

  const cleanBody = filter && body ? (Array.isArray(body) 
    ? body.map(item => filterNulls(item)) 
    : filterNulls(body)) : body;


  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Auth-Token': auth.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: cleanBody,
    })
    .then((res) => res.body)
    .catch((err) => {
      throw new Error(
        `Error in request to ${path}: ${err.message || JSON.stringify(err)}`
      );
    });
}

export const bigCommerceApiService = {
  async createWebhook({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: {
      scope: string;
      destination: string;
      is_active: boolean;
    };
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v3/hooks',
      method: HttpMethod.POST,
      body: payload,
    });
  },
  async createCustomer({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v3/customers',
      method: HttpMethod.POST,
      body: payload,
    });
  },
  async fetchCustomers({
    auth,
    queryString,
  }: {
    auth: bigCommerceAuth;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/customers${queryString ? `?${queryString}` : ''}`,
      method: HttpMethod.GET,
    });
  },
  async fetchCustomerAddresses({
    auth,
    queryString,
  }: {
    auth: bigCommerceAuth;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/customers/addresses${queryString ? `?${queryString}` : ''}`,
      method: HttpMethod.GET,
    });
  },
  async fetchProducts({
    auth,
    queryString,
  }: {
    auth: bigCommerceAuth;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/catalog/products${queryString ? `?${queryString}` : ''}`,
      method: HttpMethod.GET,
    });
  },
  async createProduct({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v3/catalog/products',
      method: HttpMethod.POST,
      body: payload,
      filter: true,
    });
  },
  async updateProduct({
    auth,
    productId,
    payload,
  }: {
    auth: bigCommerceAuth;
    productId: string | number;
    payload: unknown;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/catalog/products/${productId}`,
      method: HttpMethod.PUT,
      body: payload,
      filter: true,
    });
  },
  async deleteProduct({
    auth,
    productId,
  }: {
    auth: bigCommerceAuth;
    productId: string | number;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/catalog/products/${productId}`,
      method: HttpMethod.DELETE,
    });
  },
  async fetchOrders({
    auth,
    queryString,
  }: {
    auth: bigCommerceAuth;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v2/orders${queryString ? `?${queryString}` : ''}`,
      method: HttpMethod.GET,
    });
  },
  async fetchOrder({
    auth,
    orderId,
  }: {
    auth: bigCommerceAuth;
    orderId: string | number;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v2/orders/${orderId}`,
      method: HttpMethod.GET,
    });
  },
  async fetchCategories({
    auth,
    queryString,
  }: {
    auth: bigCommerceAuth;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/catalog/categories${queryString ? `?${queryString}` : ''}`,
      method: HttpMethod.GET,
    });
  },
  async createBlogPost({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v2/blog/posts',
      method: HttpMethod.POST,
      body: payload,
    });
  },
  async createCustomerAddress({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v3/customers/addresses',
      method: HttpMethod.POST,
      body: payload,
    });
  },
  async deleteWebhook({
    auth,
    webhookId,
  }: {
    auth: bigCommerceAuth;
    webhookId: string;
  }) {
    return await fireHttpRequest({
      auth,
      path: `/v3/hooks/${webhookId}`,
      method: HttpMethod.DELETE,
    });
  },
};

function filterNulls(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(filterNulls);

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, filterNulls(v)])
  );
}
