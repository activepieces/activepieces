import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://chat.synkra.co.za/api/v1';

export type SynkraChatAuthProps = {
  access_token: string;
  account_id: string;
};

type RequestParams = {
  auth: SynkraChatAuthProps;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
};

export async function synkraChatRequest<T = unknown>({
  auth,
  method,
  path,
  body,
  queryParams,
}: RequestParams): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}/accounts/${auth.account_id}${normalizedPath}`;

  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers: {
      api_access_token: auth.access_token,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}
