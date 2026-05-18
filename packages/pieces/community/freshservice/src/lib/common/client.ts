import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type FreshserviceAuth = AppConnectionValueForAuthProperty<
  typeof freshserviceAuth
>;

function buildBaseUrl(domain: string): string {
  return `https://${domain}.freshservice.com/api/v2`;
}

export async function freshserviceApiCall<T extends HttpMessageBody>({
  method,
  endpoint,
  auth,
  body,
  queryParams,
}: {
  method: HttpMethod;
  endpoint: string;
  auth: FreshserviceAuth;
  body?: HttpMessageBody;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const request: HttpRequest = {
    method,
    url: `${buildBaseUrl(auth.props.domain)}/${endpoint}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.props.api_key,
      password: 'X',
    },
    body,
    queryParams,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return httpClient.sendRequest<T>(request);
}

export { buildBaseUrl };
