import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateSkuParams, UpdateSkuParams } from './types';

export class Sku {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getSkuById(skuID: number) {
    const route = '/api/catalog/pvt/stockkeepingunit/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + skuID,
      headers: this.headers,
    });
    return response.body;
  }

  async getSkuListByProductId(productID: number) {
    const route = '/api/catalog_system/pvt/sku/stockkeepingunitByProductId/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + productID,
      headers: this.headers,
    });
    return response.body;
  }

  async createSku(newSkuData: CreateSkuParams) {
    const route = '/api/catalog/pvt/stockkeepingunit';
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: this.baseURL + route,
      headers: this.headers,
      body: newSkuData,
    });
    return response.body;
  }

  async updateSku(skuID: number, newSkuData: UpdateSkuParams) {
    const route = '/api/catalog/pvt/stockkeepingunit/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: this.baseURL + route + skuID,
      headers: this.headers,
      body: newSkuData,
    });
    return response.body;
  }
}
