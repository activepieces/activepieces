import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const PIXELPANDA_API = 'https://pixelpanda.ai/api/v2';

export async function pixelpandaRequest(
  auth: { secret_text: string },
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${PIXELPANDA_API}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    body,
  });
  return response.body;
}
