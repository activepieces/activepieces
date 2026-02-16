import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaApiCallParams {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}

/**
 * Makes an authenticated API call to the Canva REST API.
 */
export async function canvaApiCall<T = any>(
  params: CanvaApiCallParams
): Promise<T> {
  const { auth, method, path, body, queryParams } = params;

  const request: HttpRequest = {
    method,
    url: `${CANVA_API_BASE}${path}`,
    headers: {
      'Authorization': `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.body = body;
  }

  if (queryParams) {
    request.queryParams = queryParams;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
