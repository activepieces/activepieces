import { httpClient, HttpMethod } from '@activepieces/pieces-common';

// Helper function to get access token
export async function getAccessToken(auth: any): Promise<string> {
  // This is a simplified version. In production, implement proper token caching
  const tokenResponse = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${auth.baseUrl}/oauth2/v1/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      instance_id: auth.instanceId,
    }).toString(),
  });

  return (tokenResponse.body as any).access_token;
}
