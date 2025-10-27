import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const API_BASE_URL = 'https://api.goshippo.com';

export const shippoCommon = {
  baseUrl: API_BASE_URL,
  async makeRequest(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ) {
    return await httpClient.sendRequest({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        Authorization: `ShippoToken ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  },
};

