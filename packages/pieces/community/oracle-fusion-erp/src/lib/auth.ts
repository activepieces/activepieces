export interface OracleFusionAuth {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export async function getOAuthToken(auth: OracleFusionAuth): Promise<string> {
  const tokenResponse = await fetch(`${auth.baseUrl}/oauth2/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get OAuth token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
