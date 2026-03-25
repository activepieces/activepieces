import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BLAND_AI_BASE_URL, blandHeaders } from '../auth';

interface BlandApiCallParams {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | undefined>;
}

export async function blandApiCall({
  apiKey,
  method,
  path,
  body,
  query,
}: BlandApiCallParams) {
  const cleanQuery: Record<string, string> = {};
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') {
        cleanQuery[k] = v;
      }
    }
  }

  const response = await httpClient.sendRequest({
    method,
    url: `${BLAND_AI_BASE_URL}${path}`,
    headers: blandHeaders(apiKey),
    body: body && Object.keys(body).length > 0 ? body : undefined,
    queryParams: Object.keys(cleanQuery).length > 0 ? cleanQuery : undefined,
  });

  return response.body;
}
