import { AuthenticationType, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { GravityFormsAuthValue } from './types';

function baseUrl({ auth }: { auth: GravityFormsAuthValue }): string {
  const siteUrl = auth.props.siteUrl.trim().replace(/\/+$/, '');
  if (!siteUrl.toLowerCase().startsWith('https://')) {
    throw new Error('The Gravity Forms site URL must start with https://.');
  }
  return `${siteUrl}/wp-json/gf/v2`;
}

async function request<T>({ auth, method, path, query, body }: RequestParams & { auth: GravityFormsAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.props.consumerKey,
      password: auth.props.consumerSecret,
    },
    queryParams: query,
    body,
  });
  return response.body;
}

export const gravityFormsClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
