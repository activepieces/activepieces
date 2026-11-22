import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bigCommerceAuth, GET_BASE_URL } from './constants';

async function fireHttpRequest<T>({
  method,
  path,
  body,
  auth,
  queryParams,
  filter = false,
}: {
  method: HttpMethod;
  path: string;
  auth: bigCommerceAuth;
  body?: unknown;
  queryParams?: Record<string, string>;
  filter?: boolean;
}): Promise<T | undefined> {
  const baseUrl = GET_BASE_URL(auth.storeHash);

  const cleanBody =
    filter && body
      ? Array.isArray(body)
        ? body.map((item) => filterNulls(item))
        : filterNulls(body)
      : body;

  try {
    const res = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl}${path}`,
      headers: {
        'X-Auth-Token': auth.accessToken.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      queryParams: queryParams && Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body: cleanBody,
    });
    if (res.status === 204 || isEmptyBody(res.body)) {
      return undefined;
    }
    return res.body;
  } catch (err) {
    throw toBigCommerceError({ err, method, path });
  }
}

function isEmptyBody(body: unknown): boolean {
  return body === undefined || body === null || body === '';
}

function toBigCommerceError({
  err,
  method,
  path,
}: {
  err: unknown;
  method: HttpMethod;
  path: string;
}): BigCommerceError {
  const operation = `${method} ${path.split('?')[0]}`;
  if (err instanceof HttpError) {
    const status = err.response.status;
    const responseBody = err.response.body;
    const vendorMessage = extractVendorMessage(responseBody);
    return new BigCommerceError({
      message: `BigCommerce ${operation} failed with status ${status}${vendorMessage ? `: ${vendorMessage}` : ''}`,
      status,
      responseBody,
    });
  }
  const detail = err instanceof Error ? err.message : String(err);
  const mayHaveApplied = method !== HttpMethod.GET;
  return new BigCommerceError({
    message: `BigCommerce ${operation} could not be completed: ${detail}${
      mayHaveApplied ? '. The change may still have been applied, check the store before retrying.' : ''
    }`,
    status: 0,
    responseBody: undefined,
  });
}

function extractVendorMessage(body: unknown): string {
  const parsed = parseMaybeJson(body);
  if (typeof parsed === 'string') {
    return parsed.slice(0, 500);
  }
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => extractVendorMessage(item))
      .filter((msg) => msg !== '')
      .join('; ');
  }
  if (isRecord(parsed)) {
    const parts: string[] = [];
    if (typeof parsed['title'] === 'string') parts.push(parsed['title']);
    if (typeof parsed['message'] === 'string') parts.push(parsed['message']);
    const errors = parsed['errors'];
    if (isRecord(errors)) {
      for (const [field, value] of Object.entries(errors)) {
        parts.push(`${field}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
      }
    } else if (Array.isArray(errors)) {
      parts.push(...errors.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))));
    }
    return parts.join(' - ');
  }
  return '';
}

function parseMaybeJson(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildQuery(params: Record<string, string | number | undefined | null>): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text === '') continue;
    query[key] = text;
  }
  return query;
}

function emptyV3List<T>(): V3List<T> {
  return { data: [], meta: {} };
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
    const res = await fireHttpRequest<{ data: { id: number } }>({
      auth,
      path: '/v3/hooks',
      method: HttpMethod.POST,
      body: payload,
    });
    if (!res?.data?.id) {
      throw new Error('BigCommerce POST /v3/hooks returned no webhook id.');
    }
    return res.data;
  },
  async deleteWebhook({
    auth,
    webhookId,
  }: {
    auth: bigCommerceAuth;
    webhookId: string | number;
  }): Promise<void> {
    try {
      await fireHttpRequest<unknown>({
        auth,
        path: `/v3/hooks/${encodeURIComponent(String(webhookId))}`,
        method: HttpMethod.DELETE,
      });
    } catch (err) {
      if (err instanceof BigCommerceError && err.status === 404) {
        return;
      }
      throw err;
    }
  },
  async createCustomer({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/customers',
        method: HttpMethod.POST,
        body: payload,
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchCustomers({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/customers',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchCustomerAddresses({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/customers/addresses',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async createCustomerAddress({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/customers/addresses',
        method: HttpMethod.POST,
        body: payload,
        filter: true,
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchProducts({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/catalog/products',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchProduct({
    auth,
    productId,
  }: {
    auth: bigCommerceAuth;
    productId: string;
  }) {
    return await fireHttpRequest<{ data: BigCommerceRecord }>({
      auth,
      path: `/v3/catalog/products/${encodeURIComponent(productId)}`,
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
    return await fireHttpRequest<{ data: BigCommerceRecord; meta?: unknown }>({
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
    return await fireHttpRequest<{ data: BigCommerceRecord; meta?: unknown }>({
      auth,
      path: `/v3/catalog/products/${encodeURIComponent(String(productId))}`,
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
  }): Promise<void> {
    await fireHttpRequest<unknown>({
      auth,
      path: `/v3/catalog/products/${encodeURIComponent(String(productId))}`,
      method: HttpMethod.DELETE,
    });
  },
  async fetchBrands({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/catalog/brands',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchCategories({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }) {
    return (
      (await fireHttpRequest<V3List<BigCommerceRecord>>({
        auth,
        path: '/v3/catalog/categories',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? emptyV3List<BigCommerceRecord>()
    );
  },
  async fetchOrders({
    auth,
    query,
  }: {
    auth: bigCommerceAuth;
    query?: QueryInput;
  }): Promise<BigCommerceRecord[]> {
    return (
      (await fireHttpRequest<BigCommerceRecord[]>({
        auth,
        path: '/v2/orders',
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? []
    );
  },
  async fetchOrder({
    auth,
    orderId,
  }: {
    auth: bigCommerceAuth;
    orderId: string | number;
  }) {
    return await fireHttpRequest<BigCommerceRecord>({
      auth,
      path: `/v2/orders/${encodeURIComponent(String(orderId))}`,
      method: HttpMethod.GET,
    });
  },
  async updateOrder({
    auth,
    orderId,
    payload,
  }: {
    auth: bigCommerceAuth;
    orderId: string | number;
    payload: unknown;
  }) {
    return await fireHttpRequest<BigCommerceRecord>({
      auth,
      path: `/v2/orders/${encodeURIComponent(String(orderId))}`,
      method: HttpMethod.PUT,
      body: payload,
    });
  },
  async fetchOrderProducts({
    auth,
    orderId,
    query,
  }: {
    auth: bigCommerceAuth;
    orderId: string | number;
    query?: QueryInput;
  }): Promise<BigCommerceRecord[]> {
    return (
      (await fireHttpRequest<BigCommerceRecord[]>({
        auth,
        path: `/v2/orders/${encodeURIComponent(String(orderId))}/products`,
        method: HttpMethod.GET,
        queryParams: buildQuery(query ?? {}),
      })) ?? []
    );
  },
  async fetchOrderStatuses({ auth }: { auth: bigCommerceAuth }): Promise<BigCommerceRecord[]> {
    return (
      (await fireHttpRequest<BigCommerceRecord[]>({
        auth,
        path: '/v2/order_statuses',
        method: HttpMethod.GET,
      })) ?? []
    );
  },
  async createBlogPost({
    auth,
    payload,
  }: {
    auth: bigCommerceAuth;
    payload: unknown;
  }) {
    return await fireHttpRequest<BigCommerceRecord>({
      auth,
      path: '/v2/blog/posts',
      method: HttpMethod.POST,
      body: payload,
      filter: true,
    });
  },
};

function filterNulls(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(filterNulls);

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, filterNulls(v)])
  );
}

export class BigCommerceError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'BigCommerceError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export { buildQuery, extractVendorMessage, fireHttpRequest };

export type BigCommerceRecord = Record<string, unknown>;

export type QueryInput = Record<string, string | number | undefined | null>;

export type V3List<T> = {
  data: T[];
  meta?: {
    pagination?: {
      total?: number;
      count?: number;
      per_page?: number;
      current_page?: number;
      total_pages?: number;
    };
  };
};
