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
  // Clean store hash - remove any "store-" prefix if present
  const cleanStoreHash = auth.storeHash.replace(/^store-/, '');
  return `https://api.bigcommerce.com/stores/${cleanStoreHash}/v3`;
}

export function sendBigCommerceRequest(data: {
  url: string;
  method: HttpMethod;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
  auth: BigCommerceAuth;
}): Promise<HttpResponse<HttpMessageBody>> {
  const baseUrl = getBaseUrl(data.auth);
  const fullUrl = `${baseUrl}${data.url}`;

  // Debug logging for troubleshooting
  console.log('BigCommerce API Request:', {
    url: fullUrl,
    method: data.method,
    storeHash: data.auth.storeHash,
    hasToken: !!data.auth.accessToken,
    tokenLength: data.auth.accessToken?.length || 0,
  });

  return httpClient.sendRequest({
    url: fullUrl,
    method: data.method,
    body: data.body,
    queryParams: data.queryParams,
    headers: {
      'X-Auth-Token': data.auth.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Activepieces BigCommerce Integration',
    },
  });
}

export function handleBigCommerceError(error: unknown, defaultMessage?: string): Error {
  if (error instanceof HttpError) {
    const errorBody = error.response.body as any;

    console.error('BigCommerce API Error:', {
      status: error.response.status,
      body: errorBody,
    });

    // Handle detailed validation errors (422)
    if (error.response.status === 422 && errorBody) {
      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        const detailedErrors = errorBody.errors.map((err: any) => {
          if (typeof err === 'object' && err.field && err.message) {
            return `${err.field}: ${err.message}`;
          }
          return err.message || err.toString();
        }).join('; ');
        return new Error(`Validation failed: ${detailedErrors}`);
      }

      if (errorBody.title && errorBody.detail) {
        return new Error(`Validation failed: ${errorBody.title} - ${errorBody.detail}`);
      }

      if (errorBody.message) {
        return new Error(`Validation failed: ${errorBody.message}`);
      }
    }

    // Handle other detailed errors
    if (errorBody?.title && errorBody?.detail) {
      return new Error(`BigCommerce Error: ${errorBody.title} - ${errorBody.detail}`);
    }

    if (errorBody?.errors && Array.isArray(errorBody.errors)) {
      const errorMessages = errorBody.errors.map((err: any) => {
        if (typeof err === 'object') {
          return err.message || err.field || JSON.stringify(err);
        }
        return err.toString();
      }).join(', ');
      return new Error(`BigCommerce Error: ${errorMessages}`);
    }

    if (errorBody?.message) {
      return new Error(`BigCommerce Error: ${errorBody.message}`);
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