export async function alchemyRpcRequest<T>(
  apiKey: string,
  network: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Alchemy API error: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as {
    result?: T;
    error?: { message: string; code: number };
  };

  if (json.error) {
    throw new Error(`Alchemy RPC error: ${json.error.message}`);
  }

  return json.result as T;
}

export async function alchemyNftRequest<T>(
  apiKey: string,
  network: string,
  endpoint: string,
  queryParams: Record<string, string>
): Promise<T> {
  const qs = new URLSearchParams(queryParams).toString();
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/${endpoint}${qs ? '?' + qs : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Alchemy NFT API error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}
