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
        Accept: 'application/json',
        'User-Agent': 'Activepieces-Paperform/1.0',
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

      // Handle Paperform's specific JSON error format
      if (responseBody && typeof responseBody === 'object') {
        if (responseBody.status === 'error') {
          // Paperform API error format: {"status":"error","error_type":"not_found","message":"...","details":[...]}
          const errorType = responseBody.error_type || 'unknown';
          const message = responseBody.message || 'Unknown error';
          const details = responseBody.details ? responseBody.details.join(', ') : '';
          
          errorMessage = details ? `${message}: ${details}` : message;
          
          // Map Paperform error types to more descriptive messages
          switch (errorType) {
            case 'not_found':
              errorMessage = `Not Found: ${message}${details ? ` - ${details}` : ''}`;
              break;
            case 'validation_error':
              errorMessage = `Validation Error: ${message}${details ? ` - ${details}` : ''}`;
              break;
            case 'authorization_error':
              errorMessage = `Authorization Error: ${message}${details ? ` - ${details}` : ''}`;
              break;
            case 'rate_limit_exceeded':
              errorMessage = `Rate Limit Exceeded: ${message}${details ? ` - ${details}` : ''}`;
              break;
            default:
              errorMessage = `${errorType}: ${message}${details ? ` - ${details}` : ''}`;
          }
        } else if (responseBody.message) {
          // Fallback for other JSON error formats
          errorMessage = responseBody.message;
        }
      } else if (typeof responseBody === 'string' && responseBody.includes('<!DOCTYPE HTML')) {
        // Handle HTML error responses (CloudFront errors)
        if (status === 403) {
          errorMessage = `CloudFront 403 Error: The request could not be satisfied. This might indicate an invalid API endpoint or authentication issue. Please verify the API key and endpoint URL.`;
        } else {
          errorMessage = `CloudFront Error ${status}: The request was blocked by CloudFront. Please check the API endpoint and try again.`;
        }
      } else {
        // Handle standard HTTP status codes
        if (status === 400) {
          errorMessage = `Bad Request: ${responseBody?.message || 'Invalid request parameters'}`;
        } else if (status === 401) {
          errorMessage = `Unauthorized: Invalid or expired API key. Please check your Paperform API credentials.`;
        } else if (status === 403) {
          errorMessage = `Forbidden: ${responseBody?.message || 'Access denied to this resource'}`;
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
      }

      // Add debugging information
      console.error(`Paperform API Error: ${errorMessage}`);
      console.error(`Request URL: ${BASE_URL}${path}`);
      console.error(`Request Method: ${method}`);
      
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