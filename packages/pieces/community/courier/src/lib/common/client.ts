import {
  httpClient,
  HttpMethod,
  HttpResponse,
  HttpMessageBody,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.courier.com';

export async function courierApiCall<T extends HttpMessageBody>({
  method,
  path,
  apiKey,
  body,
  queryParams,
}: {
  method: HttpMethod;
  path: string;
  apiKey: string;
  body?: HttpMessageBody;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    body,
    queryParams,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}
