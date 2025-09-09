import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export async function copperRequest<T = any>(args: {
  auth: { api_key: string; email: string };
  method: HttpMethod;
  url: string;
  body?: any;
}): Promise<T> {
  const { auth, method, url, body } = args;

  const request: HttpRequest = {
    method,
    url: `https://api.copper.com/developer_api/v1${url}`,
    headers: {
      'X-PW-AccessToken': auth.api_key,
      'X-PW-UserEmail': auth.email,
      'X-PW-Application': 'developer_api',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await httpClient.sendRequest<T>(request);
  
  if (response.status >= 400) {
    throw new Error(`Copper API Error: ${response.status} - ${JSON.stringify(response.body)}`);
  }
  
  return response.body;
}
