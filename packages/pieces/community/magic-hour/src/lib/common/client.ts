import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

async function call<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: HttpMessageBody;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${MAGIC_HOUR_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    body,
  });

  return response.body;
}

export const magicHourApi = { call };
export const MAGIC_HOUR_BASE_URL = 'https://api.magichour.ai/v1';
