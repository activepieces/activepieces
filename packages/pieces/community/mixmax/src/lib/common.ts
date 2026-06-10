import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { MixmaxAuth } from './auth';

export const mixmaxApiClient = { getRequest, postRequest };

async function getRequest({ auth, endpoint, queryParams }: GetRequestParams) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: buildHeaders(auth),
  });
}

async function postRequest({ auth, endpoint, body }: PostRequestParams) {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${BASE_URL}${endpoint}`,
    headers: buildHeaders(auth),
    body,
  });
}

function buildHeaders(auth: MixmaxAuth) {
  return {
    'X-API-Token': auth.secret_text,
    'Content-Type': 'application/json',
  };
}

const BASE_URL = 'https://api.mixmax.com/v1';

type GetRequestParams = {
  auth: MixmaxAuth;
  endpoint: string;
  queryParams?: Record<string, string>;
};

type PostRequestParams = {
  auth: MixmaxAuth;
  endpoint: string;
  body: Record<string, unknown>;
};
