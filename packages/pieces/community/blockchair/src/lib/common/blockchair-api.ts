import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BLOCKCHAIR_BASE_URL = 'https://api.blockchair.com';

export const SUPPORTED_BLOCKCHAINS = [
  { label: 'Bitcoin (BTC)', value: 'bitcoin' },
  { label: 'Ethereum (ETH)', value: 'ethereum' },
  { label: 'Litecoin (LTC)', value: 'litecoin' },
  { label: 'Bitcoin Cash (BCH)', value: 'bitcoin-cash' },
  { label: 'Dogecoin (DOGE)', value: 'dogecoin' },
  { label: 'Dash (DASH)', value: 'dash' },
  { label: 'Ripple (XRP)', value: 'ripple' },
  { label: 'Stellar (XLM)', value: 'stellar' },
  { label: 'Monero (XMR)', value: 'monero' },
  { label: 'Cardano (ADA)', value: 'cardano' },
  { label: 'Polkadot (DOT)', value: 'polkadot' },
  { label: 'Solana (SOL)', value: 'solana' },
  { label: 'Kusama (KSM)', value: 'kusama' },
  { label: 'Groestlcoin (GRS)', value: 'groestlcoin' },
  { label: 'Zcash (ZEC)', value: 'zcash' },
];

export async function blockchairRequest(
  path: string,
  apiKey: string | undefined,
  queryParams?: Record<string, string>
) {
  const params: Record<string, string> = { ...queryParams };
  if (apiKey) {
    params['key'] = apiKey;
  }

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${BLOCKCHAIR_BASE_URL}${path}`,
    queryParams: params,
  });

  if (response.status !== 200) {
    throw new Error(
      `Blockchair API request failed with status ${response.status}`
    );
  }

  return response.body;
}
