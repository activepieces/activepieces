import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const PODIO_API_URL = 'https://api.podio.com';

export interface PodioApiCallOptions {
  method: HttpMethod;
  accessToken: string;
  resourceUri: string;
  body?: any;
  queryParams?: Record<string, any>;
}

export async function podioApiCall<T = any>(options: PodioApiCallOptions): Promise<T> {
  const { method, accessToken, resourceUri, body, queryParams } = options;

  validateRequiredFields({ accessToken, resourceUri }, ['accessToken', 'resourceUri']);

  const url = `${PODIO_API_URL}${resourceUri}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      queryParams,
    });

    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status || error.status;
    const errorBody = error.response?.body || error.body;

    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${getErrorMessage(errorBody) || 'Invalid request parameters. Please check your input values.'}`);

      case 401:
        throw new Error('Authentication failed. Your Podio access token is invalid or expired. Please reconnect your Podio account.');

      case 403:
        throw new Error(`Access denied: ${getErrorMessage(errorBody) || 'You do not have permission to perform this action. Check your user permissions in Podio.'}`);

      case 404:
        throw new Error(`Not found: ${getErrorMessage(errorBody) || 'The requested resource was not found. Please verify the ID is correct.'}`);

      case 409:
        throw new Error(`Conflict: ${getErrorMessage(errorBody) || 'The item has been modified by someone else. Please refresh and try again.'}`);

      case 420: {
        const rateLimitMsg = getRateLimitMessage(error.response?.headers);
        throw new Error(`Rate limit exceeded: ${rateLimitMsg}`);
      }

      case 422:
        throw new Error(`Validation error: ${getErrorMessage(errorBody) || 'The provided data is invalid. Please check required fields and formats.'}`);

      case 500:
        throw new Error('Podio server error. Please try again in a few minutes.');

      case 502:
      case 503:
      case 504:
        throw new Error('Podio is temporarily unavailable. Please try again in a few minutes.');

      default:
        throw new Error(`Request failed (${statusCode}): ${getErrorMessage(errorBody) || error.message || 'Unknown error occurred'}`);
    }
  }
}

export function getErrorMessage(errorBody: any): string | null {
  if (!errorBody) return null;

  if (typeof errorBody === 'string') {
    try {
      errorBody = JSON.parse(errorBody);
    } catch {
      return errorBody;
    }
  }

  return errorBody.error_description || 
         errorBody.error || 
         errorBody.message || 
         (errorBody.errors && Array.isArray(errorBody.errors) ? errorBody.errors.join(', ') : null);
}

export function getRateLimitMessage(headers: any): string {
  if (!headers) {
    return 'You have exceeded the API rate limit. Please wait before making more requests.';
  }

  const resetTime = headers['x-rate-limit-reset'] || headers['X-Rate-Limit-Reset'];
  const limit = headers['x-rate-limit-limit'] || headers['X-Rate-Limit-Limit'];

  if (resetTime) {
    const resetDate = new Date(parseInt(resetTime) * 1000);
    return `Rate limit exceeded (${limit || '1000'} calls/hour). Limit resets at ${resetDate.toLocaleTimeString()}.`;
  }

  return 'Rate limit exceeded. Podio allows 1000 API calls per hour for most operations and 250 calls/hour for rate-limited operations.';
}

export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function validateArrayLimits(arrays: Array<{ name: string; value: any[]; maxLength: number }>): void {
  for (const { name, value, maxLength } of arrays) {
    if (Array.isArray(value) && value.length > maxLength) {
      throw new Error(`${name} cannot contain more than ${maxLength} items. Current count: ${value.length}`);
    }
  }
} 