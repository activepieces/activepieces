import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const gcsCommon = {
  baseUrl: 'https://www.googleapis.com/storage/v1',

  async makeRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const response = await httpClient.sendRequest({
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body,
    });

    return response.body;
  },
};
