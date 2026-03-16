export async function graphRequest<T>(
  apiToken: string,
  path: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`https://token-api.thegraph.com${path}`);
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok)
    throw new Error(`The Graph API error: ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}
