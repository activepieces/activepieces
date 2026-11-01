import {
  HttpError,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

async function makeRequest<T>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const { status, body: responseBody } = error.errorMessage().response;
      throw new BolnaApiError({
        status,
        message: `Bolna API request failed (${status}): ${vendorMessage(responseBody)}`,
        responseBody,
      });
    }
    throw error;
  }
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.length > 0) {
    return responseBody;
  }
  if (responseBody && typeof responseBody === 'object') {
    for (const key of ['message', 'detail', 'error']) {
      const value: unknown = Reflect.get(responseBody, key);
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
      if (value !== undefined && value !== null) {
        return JSON.stringify(value);
      }
    }
    return JSON.stringify(responseBody);
  }
  return 'Unknown error';
}

class BolnaApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({
    status,
    message,
    responseBody,
  }: {
    status: number;
    message: string;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'BolnaApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const BASE_URL = 'https://api.bolna.ai';

export const bolnaClient = { makeRequest };

export { BolnaApiError };
