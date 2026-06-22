import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateCategoryParams, UpdateCategoryParams } from './types';

export class Category {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getCategory(CategoryID?: number) {
    const route = '/api/catalog/pvt/category/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + (CategoryID ? CategoryID : ''),
      headers: this.headers,
    });
    return response.body;
  }

  async getCategoryTree(categoryLevels: number) {
    const route = '/api/catalog_system/pub/category/tree/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + categoryLevels,
      headers: this.headers,
    });
    return response.body;
  }

  async createCategory(newCategoryData: CreateCategoryParams) {
    const route = '/api/catalog/pvt/category';
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: this.baseURL + route,
      headers: this.headers,
      body: newCategoryData,
    });
    return response.body;
  }

  async updateCategory(
    CategoryID: number,
    updatedCategoryData: UpdateCategoryParams
  ) {
    const route = '/api/catalog/pvt/category/';
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: this.baseURL + route + CategoryID,
      headers: this.headers,
      body: updatedCategoryData,
    });
    return response.body;
  }
}
