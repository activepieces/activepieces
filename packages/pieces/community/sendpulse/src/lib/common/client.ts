import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type SendPulseAuthProps = {
  clientId: string;
  clientSecret: string;
};

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(auth: SendPulseAuthProps): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await httpClient.sendRequest<{
    access_token: string;
    expires_in: number;
  }>({
    method: HttpMethod.POST,
    url: 'https://api.sendpulse.com/oauth/access_token',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      grant_type: 'client_credentials',
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
    },
  });

  cachedToken = response.body.access_token;
  tokenExpiresAt = Date.now() + response.body.expires_in * 1000 - 30 * 1000;
  return cachedToken!;
}

export type SendPulseApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: SendPulseAuthProps;
};

export async function sendpulseApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: SendPulseApiCallParams): Promise<T> {
  const token = await getAccessToken(auth);

  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `https://api.sendpulse.com${resourceUri}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

    throw new Error(`SendPulse API Error (${statusCode || 'Unknown'}): ${errorMessage}`);
  }
}
