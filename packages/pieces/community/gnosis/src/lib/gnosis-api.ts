import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
export const GNOSIS_PROTOCOL_SLUG = 'gnosis';
export const GNO_COIN_ID = 'gnosis';

export async function llamaGet<T>(path: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}${path}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export async function geckoGet<T>(path: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}${path}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}
