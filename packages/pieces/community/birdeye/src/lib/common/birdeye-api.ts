export async function birdeyeRequest<T>(
  apiKey: string,
  path: string,
  queryParams: Record<string, string | number | undefined> = {}
): Promise<T> {
  const url = new URL(`https://public-api.birdeye.so${path}`);
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const response = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Birdeye API error ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<T>;
}
