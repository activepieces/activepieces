import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import type { PastebinAuthValue } from './types';

function baseUrl(): string {
  return BASE_URL;
}

async function request({
  auth,
  userKey,
  script,
  option,
  fields,
}: RequestParams & { auth: PastebinAuthValue }): Promise<string> {
  const body = new URLSearchParams({
    api_option: option,
    api_dev_key: auth.props.token,
  });
  if (userKey) {
    body.append('api_user_key', userKey);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      body.append('api_' + key, value);
    }
  }
  const response = await httpClient.sendRequest<string>({
    method: HttpMethod.POST,
    url: `${BASE_URL}/api/${script}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
    },
    body,
    responseType: 'text',
  });
  return response.body;
}

async function getText({ path }: { path: string }): Promise<string> {
  const response = await httpClient.sendRequest<string>({
    method: HttpMethod.GET,
    url: `${BASE_URL}${path}`,
    responseType: 'text',
  });
  return response.body;
}

export const pastebinClient = { baseUrl, request, getText };

const BASE_URL = 'https://pastebin.com';

type RequestParams = {
  userKey?: string;
  script: string;
  option: string;
  fields: Record<string, string | undefined>;
};
