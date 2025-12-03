import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const gcsCommon = {
  gcsBaseUrl: 'https://www.googleapis.com/storage/v1',
  pubsubBaseUrl: 'https://pubsub.googleapis.com/v1',

  async makeGCSRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.gcsBaseUrl}${path}`;

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

  async makePubSubRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.pubsubBaseUrl}${path}`;

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

  // For backward compatibility
  async makeRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    return this.makeGCSRequest(method, path, accessToken, body);
  },
};
