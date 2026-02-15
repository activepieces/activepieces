import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.canva.com/rest/v1';

export const canvaCommon = {
  baseUrl: BASE_URL,

  async makeRequest<T>(
    auth: OAuth2PropertyValue,
    method: HttpMethod,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body ? { body } : {}),
      ...(queryParams ? { queryParams } : {}),
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  },

  async pollJob<T>(
    auth: OAuth2PropertyValue,
    path: string,
    maxAttempts = 30,
    delayMs = 2000,
  ): Promise<T> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await canvaCommon.makeRequest<T & { job: { status: string } }>(
        auth,
        HttpMethod.GET,
        path,
      );
      const status = result.job?.status;
      if (status === 'success' || status === 'failed') {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('Job polling timed out');
  },
};
