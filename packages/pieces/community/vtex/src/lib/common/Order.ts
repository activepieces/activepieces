import axios, { Axios } from 'axios';

export class Order {
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

  async getOrderById(OrderID: number) {
    const route = `/api/oms/pvt/orders/`;
    const response = await this.api.get(route + OrderID);
    return response.data;
  }

  async getOrderList(from: Date, to: Date) {
    const route = `/api/oms/pvt/orders?f_creationDate=creationDate:[${from.toISOString()} TO ${to.toISOString()}]`;
    const response = await this.api.get(route);
    return response.data;
  }
}
