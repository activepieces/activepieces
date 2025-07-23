export const PDFMONKEY_API_BASE_URL = 'https://api.pdfmonkey.io/api/v1';

import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export async function makeRequest({
  auth,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: {
  auth: { apiKey: string };
  path: string;
  method?: HttpMethod;
  body?: any;
  queryParams?: Record<string, string>;
}) {
  let headers: Record<string, string> | undefined = undefined;

  if (body) {
    if (typeof (body as any).getHeaders === 'function') {
      headers = (body as any).getHeaders();
    } else if(body instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if(body.constructor === Object) {
      headers = { 'Content-Type': 'application/json' };
    }
  }

  try {
    return httpClient.sendRequest({
      method,
      url: PDFMONKEY_API_BASE_URL + path,
      body,
      queryParams,
      timeout: 10000,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.apiKey.trim(),
      },
      ...(headers ? { headers } : {}),
    });
  }
  catch(err: any){
    if (err.response?.body?.error) throw new Error(`Third party error: ${err.response.body.error}`);

    const statusCode = err.response?.status;
    if (statusCode === 429) throw new Error('Rate limit exceeded. Please try again later.');
    if (statusCode === 401) throw new Error('Authentication failed. Please check your third party credentials.');
    if (statusCode === 400) throw new Error('Invalid request. Please check your parameters.');

    throw new Error(err);
  }
}