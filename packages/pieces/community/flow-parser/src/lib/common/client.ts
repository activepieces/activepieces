import { HttpMethod, httpClient, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { flowParserAuth } from './auth';

const BASE_URL = 'https://api.flowparser.one/v1';

export type FlowParserApiCallParams = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: PiecePropValueSchema<typeof flowParserAuth>;
};

export async function flowParserApiCall<T extends HttpMessageBody>({
  method,
  path,
  queryParams,
  body,
  auth,
}: FlowParserApiCallParams): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    flow_api_key: auth,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

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

    if (statusCode === 404) {
      throw new Error('Endpoint not found. Please check the API endpoint path.');
    }

    if (statusCode >= 400 && statusCode < 500) {
      const errorMessage = errorBody?.message || errorBody?.error || error.message || 'Request failed';
      throw new Error(`Request failed: ${errorMessage}`);
    }

    const originalMessage = error.message || String(error);
    throw new Error(`FlowParser API error: ${originalMessage}`);
  }
}

