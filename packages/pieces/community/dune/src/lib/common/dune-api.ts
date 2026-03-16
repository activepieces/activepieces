const DUNE_API_BASE = 'https://api.dune.com/api/v1';

export async function duneRequest<T>(
  apiKey: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'X-Dune-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${DUNE_API_BASE}${path}`, options);

  if (!response.ok) {
    throw new Error(
      `Dune API error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}
