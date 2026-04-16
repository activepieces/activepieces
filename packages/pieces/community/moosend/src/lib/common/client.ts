import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { MoosendAuth } from './auth';

const BASE_URL = 'https://api.moosend.com/v3';

export async function moosendApiCall<T extends HttpMessageBody>({
  method,
  path,
  auth,
  body,
  queryParams,
}: {
  method: HttpMethod;
  path: string;
  auth: MoosendAuth;
  body?: HttpMessageBody;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}/${path}`,
    body,
    queryParams: {
      apikey: auth.api_key,
      ...queryParams,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return httpClient.sendRequest<T>(request);
}

export { BASE_URL };
