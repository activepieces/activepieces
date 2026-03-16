const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export async function coingeckoRequest<T>(
  apiKey: string | undefined,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const queryParams = params ? new URLSearchParams(params) : undefined;
  const url = queryParams
    ? `${COINGECKO_API_BASE}${path}?${queryParams}`
    : `${COINGECKO_API_BASE}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `CoinGecko API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  return (await response.json()) as T;
}
