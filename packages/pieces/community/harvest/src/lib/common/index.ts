import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export async function callHarvestApi<T extends HttpMessageBody = any>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined = undefined,
  queryParams: any | undefined = undefined,
  headers: any | undefined = undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://api.harvestapp.com/v2/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers,
    body,
    queryParams,
  });
}