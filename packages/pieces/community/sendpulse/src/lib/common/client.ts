import { httpClient, HttpMethod, HttpRequest, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';

export type SendPulseAuthProps = {
  access_token: string;
};

export type SendPulseApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: SendPulseAuthProps;
};

export async function sendPulseApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: SendPulseApiCallParams): Promise<T> {
  const { access_token } = auth;
  if (!access_token) {
    throw new Error('SendPulse access token is required for authentication');
  }
  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }
  const baseUrl = 'https://api.sendpulse.com';
  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };
  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${errorData?.message || 'Invalid request parameters.'}`);
      case 401:
        throw new Error('Authentication Failed: Invalid or expired access token. Please reconnect your SendPulse account.');
      case 403:
        throw new Error('Access Forbidden: You do not have permission to access this resource.');
      case 404:
        throw new Error('Resource Not Found: The requested resource does not exist.');
      case 429:
        throw new Error('Rate Limit Exceeded: Too many requests. Please wait and try again.');
      case 500:
        throw new Error('Internal Server Error: SendPulse is experiencing technical difficulties.');
      case 502:
      case 503:
      case 504:
        throw new Error('Service Unavailable: SendPulse service is temporarily unavailable.');
      default:
        const errorMessage = errorData?.message || error.message || 'Unknown error occurred';
        throw new Error(`SendPulse API Error (${statusCode || 'Unknown'}): ${errorMessage}`);
    }
  }
} 