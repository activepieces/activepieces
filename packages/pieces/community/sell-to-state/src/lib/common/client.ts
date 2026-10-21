import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const BASE_URL = 'https://app.selltostate.com/api/v1';

/** One GET to the Sell to State API. Empty query values are left out. */
export async function stsGet<T>({
  apiKey,
  path,
  query = {},
}: {
  apiKey: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
}): Promise<T> {
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') queryParams[key] = String(value);
  }
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${BASE_URL}${path}`,
    headers: { 'x-api-key': apiKey },
    queryParams,
  });
  return response.body;
}

export interface SearchHit {
  title: string;
  kind: string;
  slug: string;
  sub: string;
  country?: string;
  amount?: number;
  year?: number;
  lifecycle?: string;
  deadline_at?: string;
  accepts_bids?: boolean;
  source_url?: string;
}

export interface SearchResult {
  hits: SearchHit[];
  found: number;
}
