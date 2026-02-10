import { HttpMethod, httpClient, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { linkupAuth } from './auth';

const BASE_URL = 'https://api.linkup.so';

export type LinkupApiCallParams = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: AppConnectionValueForAuthProperty<typeof linkupAuth>;
};

export async function linkupApiCall<T extends HttpMessageBody>({
  method,
  path,
  queryParams,
  body,
  auth,
}: LinkupApiCallParams): Promise<T> {
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

