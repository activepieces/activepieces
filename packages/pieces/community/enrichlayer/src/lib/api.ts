import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { BASE_URL } from './common';

export async function enrichlayerApiCall(
  auth: string,
  path: string,
  queryParams: Record<string, string | undefined>,
) {
  const filteredParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== '') {
      filteredParams[key] = value;
    }
  }

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    queryParams: filteredParams,
  });
  return response.body;
}
