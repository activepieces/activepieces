import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  HttpError,
  AuthenticationType,
} from '@activepieces/pieces-common';

import {
  type OroAuth,
  type OroAuthResponseType,
  type OroApiCallParams,
  type OroJsonApiItem,
  type OroJsonApiCollection,
  type FetchCollectionParams,
} from './types';

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function buildCacheKey({ auth }: { auth: OroAuth }): string {
  return `${auth.props.serverUrl}::${auth.props.clientId}`;
}

function formatError({ error }: { error: unknown }): string {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const body = error.response.body;
    const detail = typeof body === 'object' && body !== null
      ? JSON.stringify(body)
      : String(body ?? '');
    return `OroCommerce API Error (${status}): ${detail}`;
  }
  if (error instanceof Error) {
    return `OroCommerce API Error: ${error.message}`;
  }
  return `OroCommerce API Error: ${String(error)}`;
}

async function getAccessToken({ auth }: { auth: OroAuth }): Promise<string> {
  const cacheKey = buildCacheKey({ auth });
  const cached = tokenCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const baseUrl = auth.props.serverUrl.replace(/\/*$/, '');
  const response = await httpClient.sendRequest<OroAuthResponseType>({
    method: HttpMethod.POST,
    url: `${baseUrl}/oauth2-token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: auth.props.clientId,
      client_secret: auth.props.clientSecret,
    }).toString(),
  });

  const token = response.body.access_token;
  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + response.body.expires_in * 1000 - 30_000,
  });

  return token;
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
    const serverUrl = auth.props.serverUrl.replace(/\/*$/, '');
    const adminPrefix = auth.props.adminPrefix.replace(/^\/+|\/+$/g, '');
    const resource = resourceUri.replace(/^\/+/, '');

    return await httpClient.sendRequest({
      method,
      url: `${serverUrl}/${adminPrefix}/api/${resource}`,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        ...extraHeaders,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken({ auth }),
      },
      queryParams,
      body,
    });
  } catch (error: unknown) {
    throw new Error(formatError({ error }));
  }
}

export async function fetchCollection({
  auth,
  resourceUri,
  queryParams,
}: FetchCollectionParams): Promise<OroJsonApiItem[]> {
  const response = await oroApiCall({
    method: HttpMethod.GET,
    resourceUri,
    auth,
    queryParams: { 'page[size]': '50', ...queryParams },
  });

  const body = response.body as OroJsonApiCollection | undefined;
  return body?.data ?? [];
}
