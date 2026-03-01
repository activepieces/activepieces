import axios, { Axios } from 'axios';
import { CreateBrandParams, UpdateBrandParams } from './types';

export class Brand {
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

  async getBrandById(brandID: number) {
    const route = '/api/catalog_system/pvt/brand/';
    const response = await this.api.get(route + brandID);
    return response.data;
  }

  async getBrandList() {
    const route = '/api/catalog_system/pvt/brand/list';
    const response = await this.api.get(route);
    return response.data;
  }

  async createBrand(newBrandData: CreateBrandParams) {
    const route = '/api/catalog/pvt/brand';
    const response = await this.api.post(route, newBrandData);
    return response.data;
  }

  async updateBrand(brandID: number, updatedBrandData: UpdateBrandParams) {
    const route = '/api/catalog/pvt/brand/';
    const response = await this.api.put(route + brandID, updatedBrandData);
    return response.data;
  }

  async deleteBrand(brandID: number) {
    const route = '/api/catalog/pvt/brand/';
    const response = await this.api.delete(route + brandID);
    return response.data;
  }
}
