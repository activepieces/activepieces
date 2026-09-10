import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
} from '@activepieces/pieces-common';

export const EXPLORIUM_API_BASE_URL = 'https://api.explorium.ai';

export async function exploriumApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: HttpMessageBody;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${EXPLORIUM_API_BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
      api_key: apiKey,
    },
    body,
    queryParams,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export function resolveApiKey(auth: unknown): string {
  if (typeof auth === 'string') {
    return auth;
  }
  if (
    auth &&
    typeof auth === 'object' &&
    'secret_text' in auth &&
    typeof (auth as { secret_text: unknown }).secret_text === 'string'
  ) {
    return (auth as { secret_text: string }).secret_text;
  }
  throw new Error('Missing Explorium API key');
}
