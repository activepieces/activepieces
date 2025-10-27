import {
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
  httpClient,
  HttpError,
} from '@activepieces/pieces-common';
import { BigCommerceAuth } from './auth';

export function getBaseUrl(auth: BigCommerceAuth): string {
  const apiPath = auth.apiPath || '/stores/{store_hash}/v3';
  return `https://api.bigcommerce.com${apiPath.replace('{store_hash}', auth.storeHash)}`;
}

export function sendBigCommerceRequest(data: {
  url: string;
  method: HttpMethod;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
  auth: BigCommerceAuth;
}): Promise<HttpResponse<HttpMessageBody>> {
  return httpClient.sendRequest({
    url: `${getBaseUrl(data.auth)}${data.url}`,
    method: data.method,
    body: data.body,
    queryParams: data.queryParams,
    headers: {
      'X-Auth-Token': data.auth.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
}

export function handleBigCommerceError(error: unknown, defaultMessage?: string): Error {
  if (error instanceof HttpError) {
    const errorBody = error.response.body as any;
    
    if (errorBody?.title && errorBody?.detail) {
      return new Error(`BigCommerce Error: ${errorBody.title} - ${errorBody.detail}`);
    }

    if (errorBody?.errors && Array.isArray(errorBody.errors)) {
      const errorMessages = errorBody.errors.map((err: any) => err.message || err).join(', ');
      return new Error(`BigCommerce Error: ${errorMessages}`);
    }

    const statusMessages: Record<number, string> = {
      400: 'Bad Request - Invalid parameters provided',
      401: 'Unauthorized - Invalid access token',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource does not exist',
      409: 'Conflict - Resource already exists or operation not allowed',
      422: 'Unprocessable Entity - Validation failed',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - BigCommerce server error',
    };

    const message = statusMessages[error.response.status] || `HTTP ${error.response.status} error`;
    return new Error(defaultMessage ? `${defaultMessage}: ${message}` : message);
  }

  if (error instanceof Error) {
    return new Error(defaultMessage ? `${defaultMessage}: ${error.message}` : error.message);
  }

  return new Error(defaultMessage || 'An unknown error occurred');
}