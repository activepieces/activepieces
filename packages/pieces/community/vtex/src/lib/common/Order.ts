import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export class Order {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getOrderById(OrderID: number) {
    const route = `/api/oms/pvt/orders/`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route + OrderID,
      headers: this.headers,
    });
    return response.body;
  }

  async getOrderList(from: Date, to: Date) {
    const route = `/api/oms/pvt/orders?f_creationDate=creationDate:[${from.toISOString()} TO ${to.toISOString()}]`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route,
      headers: this.headers,
    });
    return response.body;
  }
}
