import axios, { Axios } from 'axios';
import { CreateSkuParams, UpdateSkuParams } from './types';

export class Sku {
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

  async getSkuById(skuID: number) {
    const route = '/api/catalog/pvt/stockkeepingunit/';
    const response = await this.api.get(route + skuID);
    return response.data;
  }

  async getSkuListByProductId(productID: number) {
    const route = '/api/catalog_system/pvt/sku/stockkeepingunitByProductId/';
    const response = await this.api.get(route + productID);
    return response.data;
  }

  async createSku(newSkuData: CreateSkuParams) {
    const route = '/api/catalog/pvt/stockkeepingunit';
    const response = await this.api.post(route, newSkuData);
    return response.data;
  }

  async updateSku(skuID: number, newSkuData: UpdateSkuParams) {
    const route = '/api/catalog/pvt/stockkeepingunit/';
    const response = await this.api.put(route + skuID, newSkuData);
    return response.data;
  }
}
