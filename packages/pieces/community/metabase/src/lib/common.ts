import {
  httpClient,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  CustomAuthProps,
  StaticPropsValue,
} from '@activepieces/pieces-framework';

export async function queryMetabaseApi(
  params: {
    endpoint: string;
    method: HttpMethod;
    queryParams?: QueryParams;
    headers?: HttpHeaders;
    body?: object;
    responseType?: 'arraybuffer' | 'json' | 'blob' | 'text';
  },
  auth: StaticPropsValue<CustomAuthProps>
) {
  const request: HttpRequest = {
    method: params.method,
    url: `${auth.baseUrl}/api/${params.endpoint}`,
    queryParams: params.queryParams,
    headers: {
      ...params.headers,
      'Content-Type': 'application/json',
      'X-API-KEY': auth.apiKey as string,
    },
    body: JSON.stringify(params.body),
    responseType: params.responseType,
  };
  const response = await httpClient.sendRequest(request);
  return response.body;
}
