import {
  AuthenticationType,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { RINGCENTRAL_API_BASE } from './auth';

type RingCentralApiCallParams = {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
  queryParams?: QueryParams;
};

export async function ringcentralApiCall<TResponse>({
  auth,
  method,
  resourceUri,
  body,
  queryParams,
}: RingCentralApiCallParams): Promise<TResponse> {
  const response = await httpClient.sendRequest<TResponse>({
    method,
    url: `${RINGCENTRAL_API_BASE}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body,
    queryParams,
  });

  return response.body;
}
