import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const JOBVETTA_BASE_URL = 'https://api.jobvetta.com/v1';

export function formatBearerHeader(rawKey: string): string {
  const trimmed = rawKey.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed : `Bearer ${trimmed}`;
}

export async function jobvettaGet<T>(params: {
  apiKey: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
}): Promise<T> {
  const queryParams: QueryParams = {};
  if (params.query) {
    for (const [key, value] of Object.entries(params.query)) {
      if (value !== undefined && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${JOBVETTA_BASE_URL}${params.path}`,
    headers: {
      Authorization: formatBearerHeader(params.apiKey),
      Accept: 'application/json',
    },
    queryParams,
  });

  return response.body;
}
