import { tryCatch } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function searchWeb({ query, num = 10, auth }: { query: string; num?: number; auth?: string | { secret_text: string } }): Promise<SearchResponse> {
  if (!query.trim()) throw new Error('Search query is required.');
  if (!Number.isInteger(num) || num < 1) throw new Error('Result count must be a positive integer.');
  const key = typeof auth === 'string' ? auth : auth?.secret_text;
  if (!key) throw new Error('An API key is required. Enter it in the API Key connection field.');
  const { data: response, error } = await tryCatch(() => httpClient.sendRequest<SearchResponse>({
      method: HttpMethod.GET,
      url: 'https://api.desearch.ai/web',
      queryParams: { query, num: String(Math.min(num, 20)) },
      headers: { Authorization: `Bearer ${key}` },
  }));
  if (error) {
    throw new Error('Desearch request failed.');
  }
  return response.body;
}

export const desearchSearch = { searchWeb };

export type SearchResponse = { data: { title: string; link: string; snippet: string }[] };
