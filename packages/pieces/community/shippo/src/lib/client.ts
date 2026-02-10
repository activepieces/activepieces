import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ShippoConfig, Order, ShippingLabel, ApiListResponse, CreateOrderRequest } from './common';

export class ShippoClient {
  private baseUrl = 'https://api.goshippo.com';

  constructor(private config: ShippoConfig) {}

  private async makeRequest<T>(method: HttpMethod, endpoint: string, body?: any): Promise<T> {
    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `ShippoToken ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(HttpMethod.POST, '/orders', orderData);
  }

  async getOrder(orderId: string, fields?: string[]): Promise<Order> {
    const queryParams = fields ? `?fields=${fields.join(',')}` : '';
    return this.makeRequest<Order>(HttpMethod.GET, `/orders/${orderId}${queryParams}`);
  }

  async listOrders(params?: {
    page?: number;
    results_per_page?: number;
    order_status?: string;
    placed_at_gt?: string;
  }): Promise<ApiListResponse<Order>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.results_per_page) queryParams.append('results_per_page', params.results_per_page.toString());
    if (params?.order_status) queryParams.append('order_status', params.order_status);
    if (params?.placed_at_gt) queryParams.append('placed_at_gt', params.placed_at_gt);

    const queryString = queryParams.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<ApiListResponse<Order>>(HttpMethod.GET, endpoint);
  }

  async updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order> {
    return this.makeRequest<Order>(HttpMethod.PATCH, `/orders/${orderId}`, orderData);
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.makeRequest(HttpMethod.DELETE, `/orders/${orderId}`);
  }

  async getShippingLabel(labelId: string): Promise<ShippingLabel> {
    return this.makeRequest<ShippingLabel>(HttpMethod.GET, `/transactions/${labelId}`);
  }

  async listShippingLabels(params?: {
    page?: number;
    results_per_page?: number;
  }): Promise<ApiListResponse<ShippingLabel>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.results_per_page) queryParams.append('results_per_page', params.results_per_page.toString());
   
    const queryString = queryParams.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<ApiListResponse<ShippingLabel>>(HttpMethod.GET, endpoint);
  }

  async createShippingLabel(transactionData: {
    carrier_account: string;
    servicelevel_token: string;
    shipment: string;
    metadata?: string;
    label_file_type?: 'PDF' | 'PNG' | 'ZPL';
    async?: boolean;
  }): Promise<ShippingLabel> {
    return this.makeRequest<ShippingLabel>(HttpMethod.POST, '/transactions', transactionData);
  }

  // Additional useful methods
  async createShipment(shipmentData: any): Promise<any> {
    return this.makeRequest(HttpMethod.POST, '/shipments', shipmentData);
  }

  async getRates(shipmentId: string): Promise<any> {
    return this.makeRequest(HttpMethod.GET, `/shipments/${shipmentId}/rates`);
  }

  async trackShippingLabel(trackingNumber: string, carrier: string): Promise<any> {
    return this.makeRequest(HttpMethod.GET, `/tracks/${carrier}/${trackingNumber}`);
  }
}