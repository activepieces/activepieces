import {
    httpClient,
    HttpMethod,
    HttpMessageBody,
    HttpResponse,
  } from '@activepieces/pieces-common';
  import { SecretTextConnectionValue } from '@activepieces/shared';
  
  const BASE_URL = 'https://api.smith.langchain.com/api/v1';
  
  export async function langsmithApiCall<T extends HttpMessageBody>({
    apiKey,
    method,
    path,
    body,
    queryParams,
  }: {
    apiKey: SecretTextConnectionValue;
    method: HttpMethod;
    path: string;
    body?: unknown;
    queryParams?: Record<string, string>;
  }): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'x-api-key': apiKey.secret_text,
      },
      queryParams,
      body,
    });
  }