import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

export async function calltidycalapi<T extends HttpMessageBody>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://tidycal.com/api/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}
