import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type ShortioAuthProps = {
  apiKey: string;
};

export type ShortioApiCallParams = {
  method: HttpMethod;
  resourceUri?: string;
  url?: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
  auth: ShortioAuthProps;
};

export async function shortIoApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  url,
  query,
  body,
  auth,
}: ShortioApiCallParams): Promise<T> {
  const finalUrl = url ?? `https://api.short.io${resourceUri ?? ''}`;
  
  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: finalUrl,
    headers: {
      authorization: auth.apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const status = error.response?.status;
    const message =
      error.response?.body?.message ||
      error.message ||
      'Unknown Short.io API error';
    throw new Error(
      `Short.io API Error (${status || 'No Status'}): ${message}`
    );
  }
}
