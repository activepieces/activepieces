import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function alchemyRpcRequest<T>(
  apiKey: string,
  network: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;

  const response = await httpClient.sendRequest<{
    result?: T;
    error?: { message: string; code: number };
  }>({
    method: HttpMethod.POST,
    url,
    headers: { 'Content-Type': 'application/json' },
    body: {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    },
  });

  const json = response.body;

  if (json.error) {
    throw new Error(`Alchemy RPC error: ${json.error.message}`);
  }

  if (json.result === undefined || json.result === null) {
    throw new Error(`Alchemy RPC returned no result for method: ${method}`);
  }

  return json.result;
}

export async function alchemyNftRequest<T>(
  apiKey: string,
  network: string,
  endpoint: string,
  queryParams: Record<string, string>
): Promise<T> {
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/${endpoint}`;

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    queryParams,
  });

  return response.body;
}
