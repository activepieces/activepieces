import { HttpMethod, httpClient } from '@activepieces/pieces-common';

async function smartleadRequest<T>({
  endpoint,
  method,
  apiKey,
  body,
  queryParams = {},
}: {
  endpoint: string;
  method: HttpMethod;
  apiKey: string;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
}): Promise<T> {
  const allParams: Record<string, string> = { api_key: apiKey };
  for (const [k, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      allParams[k] = String(value);
    }
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}/${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      queryParams: allParams,
      body,
    });
    return response.body;
  } catch (error: unknown) {
    throw toSmartleadError({ error, endpoint, method });
  }
}

function readFailure(error: unknown): { status: number | undefined; body: unknown } {
  if (typeof error !== 'object' || error === null) {
    return { status: undefined, body: undefined };
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return { status: undefined, body: undefined };
  }
  const status: unknown = Reflect.get(response, 'status');
  return {
    status: typeof status === 'number' ? status : undefined,
    body: Reflect.get(response, 'body'),
  };
}

function vendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    return body.slice(0, 300);
  }
  if (typeof body === 'object' && body !== null) {
    for (const key of ['message', 'error', 'detail']) {
      const value: unknown = Reflect.get(body, key);
      if (typeof value === 'string' && value.trim() !== '') {
        return value.slice(0, 300);
      }
    }
  }
  return undefined;
}

function toSmartleadError({
  error,
  endpoint,
  method,
}: {
  error: unknown;
  endpoint: string;
  method: HttpMethod;
}): SmartleadApiError {
  const { status, body } = readFailure(error);
  const detail = vendorMessage(body);
  const path = endpoint.split('?')[0];
  let message: string;
  if (status === 401 || status === 403) {
    message = 'SmartLead rejected the API key. Check the connection.';
  } else if (status === 404) {
    message = `SmartLead could not find the requested resource (${method} /${path}).`;
  } else if (status === 429) {
    message = 'SmartLead rate limit reached (about 10 requests per 2 seconds). Try again shortly.';
  } else if (status === undefined) {
    message = `SmartLead request failed (${method} /${path}): network error.`;
  } else {
    message = `SmartLead request failed with status ${status} (${method} /${path}).`;
  }
  return new SmartleadApiError({
    message: detail ? `${message} ${detail}` : message,
    statusCode: status,
    responseBody: body,
  });
}

class SmartleadApiError extends Error {
  readonly statusCode: number | undefined;
  readonly responseBody: unknown;
  constructor({
    message,
    statusCode,
    responseBody,
  }: {
    message: string;
    statusCode: number | undefined;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'SmartleadApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

const BASE_URL = 'https://server.smartlead.ai/api/v1';

export { BASE_URL, smartleadRequest, SmartleadApiError };
