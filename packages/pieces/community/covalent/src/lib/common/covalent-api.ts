export async function covalentRequest<T>(
  apiKey: string,
  path: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`https://api.covalenthq.com/v1/${path}`);
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok)
    throw new Error(`Covalent API error: ${response.status}`);
  const data = (await response.json()) as {
    data?: T;
    error?: boolean;
    error_message?: string;
  };
  if (data.error)
    throw new Error(data.error_message ?? 'Covalent API error');
  return data.data as T;
}
