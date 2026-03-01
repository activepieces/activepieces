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
  Product,
  ProductDiscountInput,
  ProductInput,
} from './types';

function emptyValueFilter(
  accessor: (key: string) => any
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  return params;
}

export class QuickzuAPIClient {
  constructor(private apiToken: string) {}
  async makeRequest<T extends HttpMessageBody = any>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    // const baseUrl = this.apiTableUrl.replace(/\/$/, '');
    const res = await httpClient.sendRequest<any>({
      method: method,
      url: `https://app.quickzu.com/api` + resourceUri,
      headers: {
        Authorization: this.apiToken,
      },
      queryParams: query,
      body: body,
    });
    return res.body;
  }
  async createCategory(categoryInput: CategoryInput) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/seller/categories/',
      undefined,
      categoryInput
    );
  }
  async updateCategory(
    categoryId: string,
    categoryInput: Partial<CategoryInput>
  ) {
    return await this.makeRequest(
      HttpMethod.PUT,
      `/seller/categories/${categoryId}`,
      undefined,
      categoryInput
    );
  }
  async deleteCategory(categoryId: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/seller/categories/${categoryId}`
    );
  }
  async listCategories(term?: string): Promise<ListAPIResponse<Category>> {
    return await this.makeRequest<ListAPIResponse<Category>>(
      HttpMethod.GET,
      '/seller/categories',
      prepareQuery({
        term: term,
      })
    );
  }
  async createProduct(productInput: ProductInput) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/seller/products',
      undefined,
      productInput
    );
  }
  async updateProduct(productId: string, productInput: Partial<ProductInput>) {
    return await this.makeRequest(
      HttpMethod.PUT,
      `/seller/products/${productId}`,
      undefined,
      productInput
    );
  }
  async deleteProduct(productId: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/seller/products/${productId}`
    );
  }
  async listProducts(
    term?: string,
    categoryId?: string
  ): Promise<ListAPIResponse<Product>> {
    return await this.makeRequest<ListAPIResponse<Product>>(
      HttpMethod.GET,
      '/seller/products',
      prepareQuery({
        term: term,
        category: categoryId,
      })
    );
  }
  async getOrderDetails(orderId: string) {
    return await this.makeRequest(HttpMethod.GET, `/seller/orders/${orderId}`);
  }
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return await this.makeRequest(
      HttpMethod.PUT,
      `/seller/orders/${orderId}`,
      undefined,
      {
        status: status,
      }
    );
  }
  async listOrders(page: number, limit: number) {
    return await this.makeRequest(
      HttpMethod.GET,
      '/seller/orders/',
      prepareQuery({ page: page, limit: limit })
    );
  }
  async listLiveOrders(limit: number) {
    return await this.makeRequest(
      HttpMethod.GET,
      '/seller/orders/live',
      prepareQuery({ limit: limit })
    );
  }
  async createProductDiscount(discountInput: ProductDiscountInput) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/seller/discounts',
      undefined,
      discountInput
    );
  }
  async createPromoCode(promocodeInput: ProductDiscountInput) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/seller/discounts',
      undefined,
      promocodeInput
    );
  }
  async updateBusinessTime(timingInput: BusinessTimingInput) {
    return await this.makeRequest(
      HttpMethod.PUT,
      '/seller/settings',
      undefined,
      timingInput
    );
  }
}
