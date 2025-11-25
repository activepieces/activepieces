import { HttpMethod, httpClient, HttpMessageBody } from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { greipAuth } from './auth';

const BASE_URL = 'https://greipapi.com';

export type GreipApiCallParams = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: PiecePropValueSchema<typeof greipAuth>;
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
    Authorization: `Bearer ${auth}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers,
      queryParams,
      body,
    });

    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status || error.status;
    const errorBody = error.response?.body || error.body;

    if (statusCode === 401 || statusCode === 403) {
      throw new Error('Authentication failed. Please check your API key.');
    }

    if (statusCode === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (statusCode >= 400 && statusCode < 500) {
      const errorMessage = errorBody?.message || errorBody?.error || error.message || 'Request failed';
      throw new Error(`Request failed: ${errorMessage}`);
    }

    throw error;
  }
}

