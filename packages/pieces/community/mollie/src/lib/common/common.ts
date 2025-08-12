import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const mollieAuth = PieceAuth.OAuth2({
  tokenUrl: 'https://api.mollie.com/oauth2/tokens',
  scope: [
    'payments.read',
    'payments.write',
    'refunds.read',
    'refunds.write',
    'customers.read',
    'customers.write',
    'orders.read',
    'orders.write',
    'invoices.read',
    'settlements.read',
    'chargebacks.read'
  ],
  authUrl: 'https://www.mollie.com/oauth2/authorize',
  required: true,
  description: 'Enter your Mollie API key',
});

import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export interface MollieApiConfig {
  accessToken: string;
}

export class MollieApi {
  private baseUrl = 'https://api.mollie.com/v2';

  constructor(private config: MollieApiConfig) {}

  async makeRequest<T>(endpoint: string, method: HttpMethod = HttpMethod.GET, body?: any): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${endpoint}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.config.accessToken,
      },
      body,
    });

    return response.body;
  }
  async createCustomer(data: any) {
    return this.makeRequest('/customers', HttpMethod.POST, data);
  }

  async searchCustomers(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/customers${query}`);
  }

  async createPayment(data: any) {
    return this.makeRequest('/payments', HttpMethod.POST, data);
  }

  async searchPayments(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/payments${query}`);
  }

  async createRefund(paymentId: string, data: any) {
    return this.makeRequest(`/payments/${paymentId}/refunds`, HttpMethod.POST, data);
  }

  async createOrder(data: any) {
    return this.makeRequest('/orders', HttpMethod.POST, data);
  }

  async searchOrders(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/orders${query}`);
  }

  async createPaymentLink(data: any) {
    return this.makeRequest('/payment-links', HttpMethod.POST, data);
  }
}
