import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.paperform.co/v1`;

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
  } catch (error: any) {
    // Handle HTTP errors with status codes
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText || '';
      const responseBody = error.response.body;
      
      let errorMessage = `HTTP ${status}`;
      
      if (status === 400) {
        errorMessage = `Bad Request: ${responseBody?.message || 'Invalid request parameters'}`;
      } else if (status === 401) {
        errorMessage = `Unauthorized: Invalid or expired API key`;
      } else if (status === 403) {
        errorMessage = `Forbidden: ${responseBody?.message || 'Access denied'}`;
      } else if (status === 404) {
        errorMessage = `Not Found: ${responseBody?.message || 'Resource not found'}`;
      } else if (status === 422) {
        errorMessage = `Validation Error: ${responseBody?.message || 'Invalid data provided'}`;
      } else if (status === 429) {
        errorMessage = `Rate Limited: ${responseBody?.message || 'Too many requests'}`;
      } else if (status >= 500) {
        errorMessage = `Server Error: ${responseBody?.message || 'Internal server error'}`;
      } else {
        errorMessage = `HTTP ${status}: ${statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle network or other errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Unable to connect to Paperform API');
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timeout: Paperform API did not respond in time');
    }
    
    // Generic error fallback
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}