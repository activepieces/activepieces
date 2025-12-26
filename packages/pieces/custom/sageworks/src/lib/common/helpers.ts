import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { SageworksAuth } from './auth';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(auth: SageworksAuth): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  // Get new token from Sageworks Auth
  const response = await httpClient.sendRequest<{
    access_token: string;
    expires_in: number;
  }>({
    method: HttpMethod.POST,
    url: 'https://auth.sageworks.com/connect/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      grant_type: 'client_credentials',
    }).toString(),
  });

  // Cache the token (subtract 60 seconds for safety margin)
  cachedToken = {
    token: response.body.access_token,
    expiresAt: Date.now() + (response.body.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export async function makeSageworksRequest<T = any>(
  auth: SageworksAuth,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any,
  queryParams?: Record<string, any>
): Promise<T> {
  const token = await getAccessToken(auth);

  const url = new URL(endpoint, auth.baseUrl);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }

  const request: HttpRequest = {
    method,
    url: url.toString(),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.body = body;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
