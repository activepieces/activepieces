import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const BILLPLZ_API_URL = 'https://www.billplz.com/api';
const BILLPLZ_SANDBOX_API_URL = 'https://www.billplz-sandbox.com/api';

export const billplzApi = {
  async makeRequest(auth: string, request: HttpRequest) {
    const baseUrl = auth.includes('sandbox') ? BILLPLZ_SANDBOX_API_URL : BILLPLZ_API_URL;
    
    return httpClient.sendRequest({
      ...request,
      url: `${baseUrl}${request.url}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  async getCollections(auth: string) {
    return this.makeRequest(auth, {
      method: HttpMethod.GET,
      url: '/v3/collections'
    });
  },

  async createBill(auth: string, billData: Record<string, unknown>) {
    return this.makeRequest(auth, {
      method: HttpMethod.POST,
      url: '/v3/bills',
      body: billData
    });
  },

  async getBill(auth: string, billId: string) {
    return this.makeRequest(auth, {
      method: HttpMethod.GET,
      url: `/v3/bills/${billId}`
    });
  }
};
