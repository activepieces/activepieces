import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://virtualsms.io';

export const virtualSmsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your VirtualSMS API key. Get one at https://virtualsms.io → Settings → API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await request(auth, HttpMethod.GET, '/api/v1/customer/balance');
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Invalid API key or network error: ${(e as Error).message}`,
      };
    }
  },
});

// `auth` arrives as the unwrapped string at runtime (PieceAuth.SecretText),
// but the framework types wrap it; accept `unknown` and coerce.
export async function request<T = unknown>(
  auth: unknown,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string | undefined>
): Promise<T> {
  const apiKey = String(auth);
  const req: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
    body,
    queryParams: queryParams
      ? (Object.fromEntries(
          Object.entries(queryParams).filter(
            ([, v]) => v !== undefined && v !== ''
          )
        ) as Record<string, string>)
      : undefined,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
  };
  const resp = await httpClient.sendRequest<T>(req);
  return resp.body;
}
