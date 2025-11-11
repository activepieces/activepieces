import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bigCommerceAuth, GET_BASE_URL } from './constants';

async function fireHttpRequest({
  method,
  path,
  body,
  auth,
}: {
  method: HttpMethod;
  path: string;
  auth: bigCommerceAuth;
  body?: unknown;
}) {
  const BASE_URL = GET_BASE_URL(auth.storeHash);

  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Auth-Token': auth.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
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
    payload: any;
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
    payload: any;
  }) {
    return await fireHttpRequest({
      auth,
      path: '/v3/catalog/products',
      method: HttpMethod.POST,
      body: payload,
    });
  },
  async createBlogPost({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: any;
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
    payload: any;
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
