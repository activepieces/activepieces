import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  AuthenticationType,
} from '@activepieces/pieces-common';

import {
  type OroAuth,
  type OroAuthResponseType,
  type OroApiCallParams,
  OroJsonApiItem,
  OroJsonApiCollection,
} from './types';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(auth: OroAuth): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await httpClient.sendRequest<OroAuthResponseType>({
    method: HttpMethod.POST,
    url: auth.props.serverUrl + '/oauth2-token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      grant_type: 'client_credentials',
      client_id: auth.props.clientId,
      client_secret: auth.props.clientSecret,
    },
  });

  cachedToken = response.body.access_token;
  tokenExpiresAt = Date.now() + response.body.expires_in * 1000 - 30 * 1000;

  return cachedToken;
}

export async function oroApiCall({
  method,
  resourceUri,
  auth,
  queryParams,
  body,
  headers: extraHeaders,
}: OroApiCallParams): Promise<HttpResponse<HttpMessageBody>> {
  try {
    return await httpClient.sendRequest({
      method,
      url: `${auth.props.serverUrl}/${auth.props.adminPrefix}/api${resourceUri}`,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        ...extraHeaders,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(auth),
      },
      queryParams,
      body,
    });
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorMessage =
      error.response?.data?.message || error.message || 'Unknown error';

    throw new Error(
      `OroCommerce API Error (${statusCode || 'Unknown'}): ${errorMessage}`
    );
  }
}

export async function fetchCollection(
  auth: OroAuth,
  resourceUri: string,
  queryParams?: Record<string, string>
): Promise<OroJsonApiItem[]> {
  const response = await oroApiCall({
    method: HttpMethod.GET,
    resourceUri,
    auth,
    queryParams: { 'page[size]': '50', ...queryParams },
  });

  return (response.body as OroJsonApiCollection).data ?? [];
}
