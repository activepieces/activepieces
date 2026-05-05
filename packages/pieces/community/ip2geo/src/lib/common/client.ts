import {
  HttpMethod,
  httpClient,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { ip2geoAuth } from './auth';

const BASE_URL = 'https://api.ip2geo.dev';

export type Ip2geoApiCallParams = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  auth: AppConnectionValueForAuthProperty<typeof ip2geoAuth>;
};

export async function ip2geoApiCall<T extends HttpMessageBody>({
  method,
  path,
  queryParams,
  auth,
}: Ip2geoApiCallParams): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'X-Api-Key': auth.secret_text,
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
    });

    return response.body;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } ; message?: string };
    const statusCode = err.response?.status;

    if (statusCode === 401 || statusCode === 403) {
      throw new Error(
        'Authentication failed. Please check your API key.',
      );
    }

    if (statusCode === 429) {
      throw new Error(
        'Rate limit exceeded. Please wait and try again.',
      );
    }

    throw new Error(
      `ip2geo API error: ${err.message || String(error)}`,
    );
  }
}
