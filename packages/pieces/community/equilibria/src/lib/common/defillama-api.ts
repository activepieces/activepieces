import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export const EQUILIBRIA_SLUG = 'equilibria';
export const EQB_COINGECKO_ID = 'equilibria-finance';

export async function defiLlamaGet<T>(path: string): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
      },
    });
    return response.body;
  } catch (err: unknown) {
    const httpErr = err as {
      response?: { body?: unknown; status?: number };
    };
    if (httpErr?.response?.body) {
      throw new Error(
        `DeFiLlama API error (${httpErr.response.status}): ${JSON.stringify(
          httpErr.response.body
        )}`
      );
    }
    throw err;
  }
}

export async function coinGeckoGet<T>(
  path: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  const qs = new URLSearchParams(queryParams).toString();
  const url = `${COINGECKO_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url,
      headers: {
        Accept: 'application/json',
      },
    });
    return response.body;
  } catch (err: unknown) {
    const httpErr = err as {
      response?: { body?: unknown; status?: number };
    };
    if (httpErr?.response?.body) {
      throw new Error(
        `CoinGecko API error (${httpErr.response.status}): ${JSON.stringify(
          httpErr.response.body
        )}`
      );
    }
    throw err;
  }
}
