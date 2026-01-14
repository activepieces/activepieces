import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.phonevalidator.com';

export class PhoneValidatorClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validatePhone(phone: string, type: 'basic' | 'fake' = 'basic') {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/api/v3/phonesearch`,
      queryParams: {
        apikey: this.apiKey,
        phone,
        type
      },
    });

    return response.body;
  }
}
