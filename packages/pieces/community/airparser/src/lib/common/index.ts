import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const url = `https://api.airparser.com${path}`;
  const isFormData =
    typeof body === 'object' &&
    body !== null &&
    typeof (body as any).getHeaders === 'function';

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'X-API-Key': apiKey,
      ...(isFormData
        ? (body as any).getHeaders()
        : { 'Content-Type': 'application/json' }),
    },
    body,
  });

  return response.body;
}
