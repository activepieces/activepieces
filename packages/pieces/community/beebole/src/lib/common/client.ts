import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://beebole-apps.com/api/v2';

async function callBeebole<T extends HttpMessageBody>({
  token,
  body,
}: {
  token: string;
  body: Record<string, unknown>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: BASE_URL,
    authentication: {
      type: AuthenticationType.BASIC,
      username: token,
      password: 'x',
    },
    body,
  });
}

export const beeboleClient = {
  call: callBeebole,
};
