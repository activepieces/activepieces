import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const MESSARI_V1_BASE = 'https://data.messari.io/api/v1';
const MESSARI_V2_BASE = 'https://data.messari.io/api/v2';

export async function messariRequest<T>(
  apiKey: string,
  version: 'v1' | 'v2',
  path: string,
  queryParams: Record<string, string | number | undefined> = {}
): Promise<T> {
  const baseUrl = version === 'v1' ? MESSARI_V1_BASE : MESSARI_V2_BASE;
  const url = new URL(`${baseUrl}${path}`);

  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: {
      'x-messari-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  return response.body;
}
