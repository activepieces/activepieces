import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  CreateProductParams,
  UpdateProductParams,
  GetProductByIdResponse,
} from './types';

export class Product {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getProductById(productID: number): Promise<GetProductByIdResponse> {
    const route = '/api/catalog/pvt/product/';
    const response = await httpClient.sendRequest<GetProductByIdResponse>({
      method: HttpMethod.GET,
      url: this.baseURL + route + productID,
      headers: this.headers,
    });
    return response.body;
  }

  async createProduct(newProductData: CreateProductParams) {
    const route = '/api/catalog/pvt/product';
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: this.baseURL + route,
      headers: this.headers,
      body: newProductData,
    });
    return response.body;
  }

  async updateProduct(
    productID: number,
    updatedProductData: UpdateProductParams
  ) {
    const route = '/api/catalog/pvt/product/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: this.baseURL + route + productID,
      headers: this.headers,
      body: updatedProductData,
    });
    return response.body;
  }
}
