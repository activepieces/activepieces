const BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

export async function moralisRequest<T>(
  apiKey: string,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Moralis API error: ${response.status} ${response.statusText} — ${text}`
    );
  }

  return (await response.json()) as T;
}
