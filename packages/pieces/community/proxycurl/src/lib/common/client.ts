import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://nubela.co/proxycurl/api';

type QueryValue = string | number | boolean | undefined | null;

export type ProxycurlApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

export async function proxycurlApiCall<T>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: ProxycurlApiCallParams): Promise<T> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: {
      Accept: 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);

    if (response.status >= 400) {
      const bodyMessage =
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body);
      throw new Error(
        `Proxycurl API error ${response.status}: ${bodyMessage}`
      );
    }

    return response.body;
  } catch (error: unknown) {
    const proxycurlError = error as {
      response?: { status?: number; body?: unknown };
      statusCode?: number;
      status?: number;
      body?: unknown;
      message?: string;
    };

    const statusCode =
      proxycurlError.response?.status ??
      proxycurlError.statusCode ??
      proxycurlError.status;
    const errorBody = proxycurlError.response?.body ?? proxycurlError.body;

    if (statusCode) {
      const bodyMessage =
        typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody);
      throw new Error(
        `Proxycurl API error ${statusCode}: ${bodyMessage || proxycurlError.message || 'Unknown error'}`
      );
    }

    throw new Error(
      `Proxycurl request failed: ${proxycurlError.message || 'Unknown error'}`
    );
  }
}
