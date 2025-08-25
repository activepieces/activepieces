import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.mollie.com/v2`;

interface ApiError {
  code?: string;
  hostname?: string;
  message?: string;
  response?: {
    status: number;
    body?: {
      detail?: string;
    };
  };
}

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: unknown) {
    const err = error as ApiError;
    // Enhanced error handling for better debugging
    if (err.code === 'ENOTFOUND') {
      throw new Error(`Network error: Unable to reach Mollie API (${err.hostname}). Please check your internet connection and DNS settings.`);
    }
    
    if (err.response) {
      const status = err.response.status;
      const errorBody = err.response.body;
      
      if (status === 401) {
        throw new Error('Authentication failed: Invalid API key or access token.');
      } else if (status === 422) {
        const details = errorBody?.detail || 'Validation error';
        throw new Error(`Mollie API validation error: ${details}`);
      } else if (status >= 400 && status < 500) {
        const details = errorBody?.detail || 'Client error';
        throw new Error(`Mollie API error (${status}): ${details}`);
      } else if (status >= 500) {
        throw new Error(`Mollie API server error (${status}). Please try again later.`);
      }
    }
    
    throw new Error(`Unexpected error: ${err.message || String(error)}`);
  }
}
