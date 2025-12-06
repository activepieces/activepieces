import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { OracleFusionAuth, getOAuthToken } from './auth';

export async function makeOracleApiCall<T>(
  auth: OracleFusionAuth,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: unknown
): Promise<T> {
  const accessToken = await getOAuthToken(auth);

  const request: HttpRequest = {
    method,
    url: `${auth.baseUrl}/fscmRestApi/resources/latest${endpoint}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.body = body;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
