import { AppConnectionType } from '@activepieces/pieces-framework';
import { describe, expect, test } from 'vitest';
import { createGoogleClient } from '../src/lib/auth';

describe('createGoogleClient with an OAuth2 connection', () => {
  test('gives the client only the access token', async () => {
    const client = await createGoogleClient(connection);

    expect(client.credentials).toEqual({ access_token: ACCESS_TOKEN });
  });

  test('surfaces a rejected access token as the 401 Google returned, without a token refresh', async () => {
    const client = await createGoogleClient(connection);
    const requestedUrls: string[] = [];
    client.transporter.defaults.fetchImplementation = async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      requestedUrls.push(url);
      return url === TOKEN_URL
        ? jsonResponse({
            status: 400,
            body: {
              error: 'invalid_request',
              error_description: 'Could not determine client ID from request.',
            },
          })
        : jsonResponse({
            status: 401,
            body: { error: { code: 401, status: 'UNAUTHENTICATED' } },
          });
    };

    await expect(client.request({ url: API_URL })).rejects.toMatchObject({
      status: 401,
    });
    expect(requestedUrls).toEqual([API_URL]);
  });
});

function jsonResponse({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const ACCESS_TOKEN = 'access-token';
const API_URL = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const connection: Parameters<typeof createGoogleClient>[0] = {
  type: AppConnectionType.OAUTH2,
  access_token: ACCESS_TOKEN,
  refresh_token: 'refresh-token',
  client_id: 'client-id',
  client_secret: 'client-secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  token_url: TOKEN_URL,
  scope: 'email',
  claimed_at: Math.round(Date.now() / 1000),
  expires_in: 3600,
  data: {},
};
