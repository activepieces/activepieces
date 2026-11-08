import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const localaiAuth = PieceAuth.CustomAuth({
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description:
        'The address of your LocalAI server, for example http://localhost:8080/v1. It must be reachable from Activepieces.',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'Access Token',
      description:
        'One of the API keys your server was started with (--api-keys or API_KEY). Leave empty if the server has no keys.',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    const baseUrl = auth.base_url.trim().replace(/\/+$/, '');
    const token = auth.access_token?.trim();
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/models`,
        timeout: 15_000,
        ...(token
          ? {
              authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token,
              },
            }
          : {}),
      });
      return { valid: true };
    } catch (error) {
      const status = readStatus(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            "LocalAI rejected the access token. Use one of the server's API keys, or leave it empty if the server has none.",
        };
      }
      return {
        valid: false,
        error: status
          ? `LocalAI answered ${status} at ${baseUrl}/models. Check the Server URL (it usually ends in /v1).`
          : `Could not reach LocalAI at ${baseUrl}. Check the Server URL and that the server is running and reachable from Activepieces.`,
      };
    }
  },
});

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof response.status === 'number'
  ) {
    return response.status;
  }
  return undefined;
}
