const REST_BASE = 'https://api.helius.xyz/v0';
const RPC_BASE = 'https://mainnet.helius-rpc.com';

export async function heliusRestRequest<T>(
  apiKey: string,
  path: string
): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${REST_BASE}${path}${separator}api-key=${apiKey}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Helius API error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

export async function heliusRpcRequest<T>(
  apiKey: string,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const url = `${RPC_BASE}/?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'helius-action',
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Helius RPC error: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as {
    result?: T;
    error?: { message: string };
  };

  if (json.error) {
    throw new Error(`Helius RPC error: ${json.error.message}`);
  }

  return json.result as T;
}
