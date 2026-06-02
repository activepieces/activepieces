import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
} from '@activepieces/pieces-common';

export const CANVA_BASE_URL = 'https://api.canva.com/rest/v1';

export async function canvaApiCall<T extends HttpMessageBody = HttpMessageBody>({
  accessToken,
  method,
  resourceUrl,
  body,
  headers,
  queryParams,
}: {
  accessToken: string;
  method: HttpMethod;
  resourceUrl: string;
  body?: unknown;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${CANVA_BASE_URL}${resourceUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers,
    queryParams,
  };

  if (body !== undefined) {
    request.body = body;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function pollJob<T>({
  accessToken,
  resourceUrl,
  isComplete,
  maxAttempts = 30,
  intervalMs = 3000,
}: {
  accessToken: string;
  resourceUrl: string;
  isComplete: (body: T) => boolean;
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await canvaApiCall<T>({
      accessToken,
      method: HttpMethod.GET,
      resourceUrl,
    });

    if (isComplete(result)) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Job did not complete after ${maxAttempts} attempts.`);
}
