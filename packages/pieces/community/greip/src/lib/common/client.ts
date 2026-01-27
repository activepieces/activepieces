import { HttpMethod, httpClient, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { greipAuth } from './auth';

const BASE_URL = 'https://greipapi.com';

export type GreipApiCallParams = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: AppConnectionValueForAuthProperty<typeof greipAuth>;
};

export async function greipApiCall<T extends HttpMessageBody>({
  method,
  path,
  queryParams,
  body,
  auth,
}: GreipApiCallParams): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.secret_text}`,
    'Content-Type': 'application/json',
  };

  const qs: QueryParams = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers,
      queryParams: qs,
      body,
    });

    // Check if response body indicates an error
    if (response.body && typeof response.body === 'object' && 'status' in response.body && response.body.status === 'error') {
      const errorBody = response.body as { code?: number; type?: string; description?: string };
      throw new Error(errorBody.description || `Greip API error (code: ${errorBody.code || 'unknown'})`);
    }

    return response.body;
  } catch (error: any) {
    // Handle Greip API error response structure
    let errorBody = error.response?.body || error.body;
    
    // Handle stringified JSON error bodies
    if (typeof errorBody === 'string') {
      try {
        errorBody = JSON.parse(errorBody);
      } catch {
        // If parsing fails, use the string as-is
      }
    }
    
    // Check if it's a Greip error response
    if (errorBody && typeof errorBody === 'object') {
      // Check for nested error structure (error.response.body)
      if (errorBody.response?.body) {
        errorBody = errorBody.response.body;
      }
      
      if ('status' in errorBody && errorBody.status === 'error') {
        const greipError = errorBody as { code?: number; type?: string; description?: string };
        const description = greipError.description || getErrorMessageByCode(greipError.code);
        throw new Error(description || `Greip API error (code: ${greipError.code || 'unknown'})`);
      }
      
      // Also check for description directly in errorBody
      if ('description' in errorBody && errorBody.description) {
        throw new Error(String(errorBody.description));
      }
    }

    const statusCode = error.response?.status || error.status;

    if (statusCode === 401 || statusCode === 403) {
      throw new Error('Authentication failed. Please check your API key.');
    }

    if (statusCode === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (statusCode === 404) {
      throw new Error('Endpoint not found. Please check the API endpoint path.');
    }

    if (statusCode >= 400 && statusCode < 500) {
      const errorMessage = errorBody?.description || errorBody?.message || errorBody?.error || error.message || 'Request failed';
      throw new Error(`Request failed: ${errorMessage}`);
    }

    // Fallback: include original error message if available
    const originalMessage = error.message || String(error);
    throw new Error(`Greip API error: ${originalMessage}`);
  }
}

function getErrorMessageByCode(code?: number): string {
  const errorMessages: Record<number, string> = {
    101: 'The API Key is missing or invalid.',
    102: 'The API Key owner account is inactive. Please contact support.',
    103: 'You reached the usage limit of your account. Please upgrade your subscription.',
    104: 'Invalid parameters. Please check the parameter values.',
    105: 'Your plan has expired. Renew the subscription to enable using the API.',
    106: 'Too many requests detected. Please slow down your request rate.',
    107: 'The callback parameter value cannot be a function name.',
    108: 'Invalid format. Use JSON, XML, CSV, or Newline.',
    109: 'Callback feature can only be used with JSON format.',
    110: 'Invalid language. Use EN, AR, FR, DE, ES, JA, ZH, or RU.',
    111: 'Invalid mode. Use test or live.',
    112: 'The IP Address is not valid or empty.',
    113: 'Request sent from a domain that is not whitelisted in your API settings.',
    114: 'Security module is not available in the free plan. Please upgrade.',
    115: 'An error occurred while processing your request. Please try again later.',
    116: 'The Country Code is invalid or not found.',
    117: 'This feature is not available for your plan. Please upgrade.',
    118: 'The Phone Number is invalid or missing.',
    119: 'The Email Address is invalid or missing.',
    120: 'The BIN number is invalid or missing.',
    121: 'The AS Number is empty or invalid.',
    122: 'The IBAN is invalid or missing.',
    123: 'The user identifier is invalid or too long.',
    124: 'The user type is invalid or missing. Use email, phone, or user_id.',
    125: 'The user value is invalid or missing.',
    126: 'You have reached the limit of deletions for this day. Please wait until the next day.',
  };

  return errorMessages[code || 0] || 'An unknown error occurred.';
}

