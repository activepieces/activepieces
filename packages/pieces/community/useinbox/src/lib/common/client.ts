import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  AuthenticationType,
} from '@activepieces/pieces-common';

const ACCOUNT_BASE_URL = 'https://useapi.useinbox.com';
const INBOX_BASE_URL = 'https://useapi.useinbox.com/inbox/v1';
const NOTIFY_BASE_URL = 'https://useapi.useinbox.com/notify/v1';

type TokenResponse = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
};

async function fetchAccessToken({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<string> {
  const response = await httpClient.sendRequest<TokenResponse>({
    method: HttpMethod.POST,
    url: `${ACCOUNT_BASE_URL}/token`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      EmailAddress: email,
      Password: password,
    },
  });
  const token = response.body?.resultObject?.access_token;
  if (!token) {
    throw new Error(
      'Failed to retrieve INBOX access token. Check email and password.'
    );
  }
  return token;
}

async function inboxApiCall<T extends HttpMessageBody>({
  token,
  service,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  service: 'inbox' | 'notify';
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string | undefined>;
}): Promise<HttpResponse<T>> {
  const base = service === 'inbox' ? INBOX_BASE_URL : NOTIFY_BASE_URL;
  const cleanedQuery: Record<string, string> | undefined = queryParams
    ? (Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v !== undefined)
      ) as Record<string, string>)
    : undefined;
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${base}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: { 'Content-Type': 'application/json' },
    body,
    queryParams: cleanedQuery,
  });
  return response;
}

export const useinboxClient = {
  fetchAccessToken,
  inboxApiCall,
  ACCOUNT_BASE_URL,
  INBOX_BASE_URL,
  NOTIFY_BASE_URL,
};
