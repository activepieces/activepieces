import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateBrandParams, UpdateBrandParams } from './types';

export class Brand {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getBrandById(brandID: number) {
    const route = '/api/catalog_system/pvt/brand/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + brandID,
      headers: this.headers,
    });
    return response.body;
  }

  async getBrandList() {
    const route = '/api/catalog_system/pvt/brand/list';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route,
      headers: this.headers,
    });
    return response.body;
  }

  async createBrand(newBrandData: CreateBrandParams) {
    const route = '/api/catalog/pvt/brand';
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: this.baseURL + route,
      headers: this.headers,
      body: newBrandData,
    });
    return response.body;
  }

  async updateBrand(brandID: number, updatedBrandData: UpdateBrandParams) {
    const route = '/api/catalog/pvt/brand/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: this.baseURL + route + brandID,
      headers: this.headers,
      body: updatedBrandData,
    });
    return response.body;
  }

  async deleteBrand(brandID: number) {
    const route = '/api/catalog/pvt/brand/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: this.baseURL + route + brandID,
      headers: this.headers,
    });
    return response.body;
  }
}
