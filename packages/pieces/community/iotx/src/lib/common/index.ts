export const IOTEX_API_BASE = 'https://babel-api.mainnet.iotex.io';
export const COINGECKO_IOTEX_URL =
  'https://api.coingecko.com/api/v3/coins/iotex?localization=false&tickers=false&community_data=false&developer_data=false';

export async function iotexRpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(`${IOTEX_API_BASE}/v1`, {
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
    throw new Error(`IoTeX API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { result?: unknown; error?: { message: string } };
  if (json.error) {
    throw new Error(`IoTeX RPC error: ${json.error.message}`);
  }
  return json.result;
}
