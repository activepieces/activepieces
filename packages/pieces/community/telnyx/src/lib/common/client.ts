import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const TELNYX_API_BASE_URL = 'https://api.telnyx.com/v2';

type TelnyxRequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
};

export async function telnyxRequest<TResponse>({
  apiKey,
  method,
  path,
  body,
}: TelnyxRequestParams): Promise<TResponse> {
  const response = await httpClient.sendRequest<TResponse>({
    method,
    url: `${TELNYX_API_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  });

  return response.body;
}
