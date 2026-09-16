import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const STRING_API_BASE_URL = 'https://request.usestring.ai/v1';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: QueryParams
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${STRING_API_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  });

  return response.body;
}

export function describeRequestError(error: any, fallback: string): Error {
  const status = error?.response?.status;
  if (status === 401) {
    return new Error(
      'String Web Access rejected the API key (401). Create a new key at https://portal.usestring.ai/settings.'
    );
  }
  if (status === 402) {
    return new Error(
      'The API key is valid but the account balance cannot cover this request (402). Top up at https://portal.usestring.ai/settings.'
    );
  }
  if (status === 403) {
    return new Error(
      'The destination is not enabled for this organization (403). Contact String support to request access.'
    );
  }
  if (status === 429) {
    return new Error('String Web Access rate limit reached (429). Slow down the requests and retry.');
  }
  return error instanceof Error ? error : new Error(fallback);
}
