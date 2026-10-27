import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { OrderStatus } from './constants';
import {
  BusinessTimingInput,
  Category,
  CategoryInput,
  ListAPIResponse,
  Order,
  Product,
  ProductDiscountInput,
  ProductInput,
} from './types';

function isPresent(value: QueryValue): value is string | number {
  if (value === null || value === undefined) {
    return false;
  }
  return typeof value !== 'string' || value.length > 0;
}

export function prepareQuery(request?: Record<string, QueryValue>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  for (const [key, value] of Object.entries(request)) {
    if (isPresent(value)) {
      params[key] = value.toString();
    }
  }
  return params;
}

function extractVendorMessage(body: unknown): string | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.startsWith('<')) {
      return undefined;
    }
    return truncate(trimmed);
  }
  if (Array.isArray(body)) {
    const messages = body
      .map((item) => extractVendorMessage(item))
      .filter((item): item is string => item !== undefined);
    return messages.length > 0 ? truncate(messages.join('; ')) : undefined;
  }
  if (typeof body === 'object') {
    for (const key of ['message', 'error', 'msg', 'errors']) {
      const candidate: unknown = Reflect.get(body, key);
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return truncate(candidate.trim());
      }
      if (typeof candidate === 'object' && candidate !== null) {
        const nested = extractVendorMessage(candidate);
        if (nested) return nested;
      }
    }
    const serialized = JSON.stringify(body);
    return serialized === '{}' ? undefined : truncate(serialized);
  }
  return truncate(String(body));
}

function truncate(text: string): string {
  return text.length > MAX_VENDOR_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_VENDOR_MESSAGE_LENGTH)}...`
    : text;
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) return undefined;
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') return undefined;
  return { status, body: Reflect.get(response, 'body') };
}

export function toQuickzuError({ error, hint400 }: { error: unknown; hint400?: string }): Error {
  const failure = readHttpFailure(error);
  if (!failure) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const vendorMessage = extractVendorMessage(failure.body);
  const hint = failure.status === 400 && hint400 ? hint400 : STATUS_HINTS[failure.status];
  const parts = [`Quickzu request failed with status ${failure.status}.`];
  if (hint) parts.push(hint);
  if (vendorMessage) parts.push(`Quickzu says: ${vendorMessage}`);
  return new QuickzuApiError({
    message: parts.join(' '),
    statusCode: failure.status,
    responseBody: failure.body,
  });
}

export class QuickzuApiError extends Error {
  readonly statusCode: number;
  readonly responseBody: unknown;
  constructor({
    message,
    statusCode,
    responseBody,
  }: {
    message: string;
    statusCode: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'QuickzuApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class QuickzuAPIClient {
  constructor(private apiToken: string) {}

  async makeRequest<T extends HttpMessageBody>({
    method,
    resourceUri,
    query,
    body,
    hint400,
  }: {
    method: HttpMethod;
    resourceUri: string;
    query?: QueryParams;
    body?: unknown;
    hint400?: string;
  }): Promise<T> {
    try {
      const res = await httpClient.sendRequest<T>({
        method,
        url: `${QUICKZU_BASE_URL}${resourceUri}`,
        headers: {
          Authorization: this.apiToken,
          Accept: 'application/json',
        },
        queryParams: query,
        body,
      });
      return res.body;
    } catch (error) {
      throw toQuickzuError({ error, hint400 });
    }
  }

  async createCategory(categoryInput: CategoryInput) {
    return await this.makeRequest<Category>({
      method: HttpMethod.POST,
      resourceUri: '/seller/categories/',
      body: categoryInput,
    });
  }

  async updateCategory({
    categoryId,
    categoryInput,
  }: {
    categoryId: string;
    categoryInput: Partial<CategoryInput>;
  }) {
    return await this.makeRequest<StatusMessageResponse>({
      method: HttpMethod.PUT,
      resourceUri: `/seller/categories/${encodeURIComponent(categoryId)}`,
      body: categoryInput,
    });
  }

  async deleteCategory(categoryId: string) {
    return await this.makeRequest<StatusMessageResponse>({
      method: HttpMethod.DELETE,
      hint400: DELETE_HINT,
      resourceUri: `/seller/categories/${encodeURIComponent(categoryId)}`,
    });
  }

  async listCategories(term?: string): Promise<ListAPIResponse<Category>> {
    return await this.makeRequest<ListAPIResponse<Category>>({
      method: HttpMethod.GET,
      resourceUri: '/seller/categories',
      query: prepareQuery({ term }),
    });
  }

  async createProduct(productInput: ProductInput) {
    return await this.makeRequest<Product>({
      method: HttpMethod.POST,
      resourceUri: '/seller/products',
      body: productInput,
    });
  }

  async updateProduct({
    productId,
    productInput,
  }: {
    productId: string;
    productInput: Partial<ProductInput>;
  }) {
    return await this.makeRequest<Product>({
      method: HttpMethod.PUT,
      resourceUri: `/seller/products/${encodeURIComponent(productId)}`,
      body: productInput,
    });
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    const res = await this.listProducts();
    return res.data.find((product) => product._id === productId);
  }

  async deleteProduct(productId: string) {
    return await this.makeRequest<StatusMessageResponse>({
      method: HttpMethod.DELETE,
      hint400: DELETE_HINT,
      resourceUri: `/seller/products/${encodeURIComponent(productId)}`,
    });
  }

  async listProducts({
    term,
    categoryId,
  }: {
    term?: string;
    categoryId?: string;
  } = {}): Promise<ListAPIResponse<Product>> {
    return await this.makeRequest<ListAPIResponse<Product>>({
      method: HttpMethod.GET,
      resourceUri: '/seller/products',
      query: prepareQuery({ term, category: categoryId }),
    });
  }

  async getOrderDetails(orderId: string) {
    return await this.makeRequest<Order>({
      method: HttpMethod.GET,
      resourceUri: `/seller/orders/${encodeURIComponent(orderId)}`,
    });
  }

  async updateOrderStatus({
    orderId,
    status,
  }: {
    orderId: string;
    status: OrderStatus;
  }) {
    return await this.makeRequest<Order>({
      method: HttpMethod.PUT,
      resourceUri: `/seller/orders/${encodeURIComponent(orderId)}`,
      body: { status },
    });
  }

  async listOrders({ page, limit }: { page: number; limit: number }) {
    return await this.makeRequest<ListAPIResponse<Order>>({
      method: HttpMethod.GET,
      resourceUri: '/seller/orders/',
      query: prepareQuery({ page, limit }),
    });
  }

  async listLiveOrders(limit: number) {
    return await this.makeRequest<LiveOrdersResponse>({
      method: HttpMethod.GET,
      resourceUri: '/seller/orders/live',
      query: prepareQuery({ limit }),
    });
  }

  async createDiscount(discountInput: ProductDiscountInput) {
    return await this.makeRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      resourceUri: '/seller/discounts',
      body: discountInput,
    });
  }

  async updateBusinessTime(timingInput: BusinessTimingInput) {
    return await this.makeRequest<StatusMessageResponse>({
      method: HttpMethod.PUT,
      resourceUri: '/seller/settings',
      body: timingInput,
    });
  }
}

type LiveOrdersResponse = { data: Order[][]; status: boolean };

type StatusMessageResponse = { status: boolean; message: string };

type QueryValue = string | number | null | undefined;

const MAX_VENDOR_MESSAGE_LENGTH = 300;

const DELETE_HINT = 'The item may already be deleted or the ID may not exist.';

const STATUS_HINTS: Record<number, string> = {
  401: 'Check that the API token is correct and still active.',
  403: 'The API token does not have access to this resource.',
  404: 'The requested record was not found. Check the ID.',
  429: 'Rate limit reached. Try again later.',
};

export const QUICKZU_BASE_URL = 'https://app.quickzu.com/api';
