import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const REST_BASE = 'https://api.helius.xyz/v0';
const RPC_BASE = 'https://mainnet.helius-rpc.com';

export async function heliusRestRequest<T>(
  apiKey: string,
  path: string
): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${REST_BASE}${path}${separator}api-key=${apiKey}`;

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: { 'Content-Type': 'application/json' },
  });

  return response.body;
}

export async function heliusRpcRequest<T>(
  apiKey: string,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const url = `${RPC_BASE}/?api-key=${apiKey}`;

  const response = await httpClient.sendRequest<{
    result?: T;
    error?: { message: string };
  }>({
    method: HttpMethod.POST,
    url,
    headers: { 'Content-Type': 'application/json' },
    body: {
      jsonrpc: '2.0',
      id: 'helius-action',
      method,
      params,
    },
  });

  const json = response.body;

  if (json.error) {
    throw new Error(`Helius RPC error: ${json.error.message}`);
  }

  if (json.result === undefined) {
    throw new Error('Helius RPC returned unexpected response: no result field');
  }
  return json.result as T;
}
