export const GMX_STATS_BASE_URL = 'https://stats.gmx.io/api/gmx';
export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export type Chain = 'arbitrum' | 'avalanche';

export const GMX_CHAINS: { label: string; value: Chain }[] = [
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Avalanche', value: 'avalanche' },
];
