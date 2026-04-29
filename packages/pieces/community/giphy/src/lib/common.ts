import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { SecretTextConnectionValue } from '@activepieces/shared';
export const giphyApiClient = { get: getRequest, post: postRequest, put: putRequest, patch: patchRequest, delete: deleteRequest };

async function getRequest({ auth, endpoint, queryParams }: GetParams) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: buildHeaders(auth),
  });
}

async function postRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${BASE_URL}${endpoint}`,
    headers: buildHeaders(auth),
    body,
  });
}

async function putRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.PUT,
    url: `${BASE_URL}${endpoint}`,
    headers: buildHeaders(auth),
    body,
  });
}

async function patchRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.PATCH,
    url: `${BASE_URL}${endpoint}`,
    headers: buildHeaders(auth),
    body,
  });
}

async function deleteRequest({ auth, endpoint }: DeleteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `${BASE_URL}${endpoint}`,
    headers: buildHeaders(auth),
  });
}

function buildHeaders(_auth: SecretTextConnectionValue) {
  return { 'Content-Type': 'application/json' };
}
const BASE_URL = 'https://api.giphy.com/v1';

type GetParams = { auth: SecretTextConnectionValue; endpoint: string; queryParams?: Record<string, unknown> };
type WriteParams = { auth: SecretTextConnectionValue; endpoint: string; body: Record<string, unknown> };
type DeleteParams = { auth: SecretTextConnectionValue; endpoint: string };