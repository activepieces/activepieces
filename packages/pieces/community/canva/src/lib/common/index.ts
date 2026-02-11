import {
  AuthenticationType,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

export const canvaCommon = {
  baseUrl: 'https://api.canva.com/rest/v1',
};

export async function callCanvaApi<T extends HttpMessageBody = any>(
  method: HttpMethod,
  path: string,
  accessToken: string,
  body?: Record<string, unknown>
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${canvaCommon.baseUrl}/${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body,
  });
}
