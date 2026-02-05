import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://www.formstack.com/api/v2';

export const RATE_LIMIT = {
  DAILY_LIMIT: 14400, // 14,400 calls per access token per day
  WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

export enum RequestFormat {
  JSON = 'json',
  URL_ENCODED = 'url-encoded',
}

interface RequestOptions {
  format?: RequestFormat;
  useQueryAuth?: boolean;
}

export async function makeRequest(
  accessToken: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, any>,
  options: RequestOptions = {}
) {
  const {
    format = RequestFormat.JSON,
    useQueryAuth = false,
  } = options;

  try {
    const headers: Record<string, string> = {};
    
    if (useQueryAuth) {
      queryParams = { ...queryParams, oauth_token: accessToken };
    } else {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Only set content type and process body for requests that should have a body
    let requestBody = undefined;
    const shouldHaveBody = method !== HttpMethod.GET && method !== HttpMethod.DELETE && body !== undefined;
    
    if (shouldHaveBody) {
      if (format === RequestFormat.JSON) {
        headers['Content-Type'] = 'application/json';
        requestBody = body;
      } else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof body === 'object') {
          requestBody = Object.entries(body as Record<string, any>)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
        } else {
          requestBody = body;
        }
      }
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body: requestBody,
      queryParams,
    });

    return response.body;

  } catch (error: any) {
    const status = error.response?.status || error.status;
    const errorMessage = error.response?.body?.error || error.message || 'Unknown error';

    switch (status) {
      case 400:
        throw new Error(`Bad Request: The request URI was invalid. ${errorMessage}`);
      
      case 401:
        throw new Error(`Unauthorized: Valid OAuth2 credentials were not supplied. Please check your access token.`);
      
      case 403:
        throw new Error(`Forbidden: You do not have access to this resource. Check your user permissions in Formstack.`);
      
      case 404:
        throw new Error(`Not Found: The requested resource could not be found. ${errorMessage}`);
      
      case 405:
        throw new Error(`Method Not Allowed: The requested HTTP method is not supported for this endpoint.`);
      
      case 415:
        throw new Error(`Unsupported Media Type: Please use a valid media type (JSON or URL-encoded).`);
      
      case 429:
        throw new Error(`Rate Limit Exceeded: You have hit the daily limit of ${RATE_LIMIT.DAILY_LIMIT} API calls. Try again in 24 hours.`);
      
      case 500:
        throw new Error(`Internal Server Error: An error occurred while processing the request. Please try again later.`);
      
      default:
        throw new Error(`Request failed (${status}): ${errorMessage}`);
    }
  }
}

export async function makeFormRequest(
  accessToken: string,
  method: HttpMethod,
  path: string,
  formData: Record<string, any>,
  queryParams?: Record<string, any>
) {
  return makeRequest(accessToken, method, path, formData, queryParams, {
    format: RequestFormat.URL_ENCODED,
  });
}
