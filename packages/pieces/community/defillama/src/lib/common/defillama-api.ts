import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_API_BASE = 'https://api.llama.fi';
const DEFILLAMA_COINS_BASE = 'https://coins.llama.fi';
const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';

export async function defillamaRequest<T>(
  url: string
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
  });

  return response.body;
}

export function apiUrl(path: string): string {
  return `${DEFILLAMA_API_BASE}${path}`;
}

export function coinsUrl(path: string): string {
  return `${DEFILLAMA_COINS_BASE}${path}`;
}

export function yieldsUrl(path: string): string {
  return `${DEFILLAMA_YIELDS_BASE}${path}`;
}
