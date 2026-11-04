import { HttpError, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { PodioAuthValue, PodioErrorBody } from './types';

function baseUrl(): string {
  return 'https://api.podio.com';
}

async function request<T>({ auth, method, path, query, body, timeout }: RequestParams & { auth: PodioAuthValue }): Promise<T> {
  validateRequiredFields({ data: { accessToken: auth.access_token, resourceUri: path }, requiredFields: ['accessToken', 'resourceUri'] });

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl()}${path}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      queryParams: query,
      timeout,
    });

    return response.body;
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.response.status : undefined;
    const errorBody = error instanceof HttpError ? error.response.body : undefined;

    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${getErrorMessage({ errorBody }) || 'Invalid request parameters. Please check your input values.'}`);

      case 401:
        throw new Error('Authentication failed. Your Podio access token is invalid or expired. Please reconnect your Podio account.');

      case 403:
        throw new Error(`Access denied: ${getErrorMessage({ errorBody }) || 'You do not have permission to perform this action. Check your user permissions in Podio.'}`);

      case 404:
        throw new Error(`Not found: ${getErrorMessage({ errorBody }) || 'The requested resource was not found. Please verify the ID is correct.'}`);

      case 409:
        throw new Error(`Conflict: ${getErrorMessage({ errorBody }) || 'The item has been modified by someone else. Please refresh and try again.'}`);

      case 420:
        throw new Error('Rate limit exceeded: You have exceeded the API rate limit. Please wait before making more requests.');

      case 422:
        throw new Error(`Validation error: ${getErrorMessage({ errorBody }) || 'The provided data is invalid. Please check required fields and formats.'}`);

      case 500:
        throw new Error('Podio server error. Please try again in a few minutes.');

      case 502:
      case 503:
      case 504:
        throw new Error('Podio is temporarily unavailable. Please try again in a few minutes.');

      default:
        throw new Error(`Request failed (${statusCode}): ${getErrorMessage({ errorBody }) || (error instanceof Error && error.message) || 'Unknown error occurred'}`);
    }
  }
}

function getErrorMessage({ errorBody }: { errorBody: unknown }): string | null {
  if (!errorBody) return null;

  if (typeof errorBody === 'string') {
    try {
      return readErrorBody({ body: JSON.parse(errorBody) });
    } catch {
      return errorBody;
    }
  }

  return typeof errorBody === 'object' ? readErrorBody({ body: errorBody }) : null;
}

function readErrorBody({ body }: { body: PodioErrorBody }): string | null {
  return body.error_description ||
         body.error ||
         body.message ||
         (Array.isArray(body.errors) ? body.errors.join(', ') : null);
}

function validateRequiredFields({ data, requiredFields }: { data: Record<string, unknown>; requiredFields: string[] }): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export const podioClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown; timeout?: number };
