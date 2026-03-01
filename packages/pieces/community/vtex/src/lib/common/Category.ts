import axios, { Axios } from 'axios';
import { CreateCategoryParams, UpdateCategoryParams } from './types';

export class Category {
  api: Axios;

  constructor(host: string, appKey: string, appToken: string) {
    this.api = axios.create({
      baseURL: 'https://' + host,
      headers: {
        'X-VTEX-API-AppKey': appKey,
        'X-VTEX-API-AppToken': appToken,
      },
    });
  }

  async getCategory(CategoryID?: number) {
    const route = '/api/catalog/pvt/category/';
    const response = await this.api.get(route + (CategoryID ? CategoryID : ''));
    return response.data;
  }

  async getCategoryTree(categoryLevels: number) {
    const route = '/api/catalog_system/pub/category/tree/';
    const response = await this.api.get(route + categoryLevels);
    return response.data;
  }

  async createCategory(newCategoryData: CreateCategoryParams) {
    const route = '/api/catalog/pvt/category';
    const response = await this.api.post(route, newCategoryData);
    return response.data;
  }

  async updateCategory(
    CategoryID: number,
    updatedCategoryData: UpdateCategoryParams
  ) {
    const route = '/api/catalog/pvt/category/';
    const response = await this.api.put(
      route + CategoryID,
      updatedCategoryData
    );
    return response.data;
  }
}
