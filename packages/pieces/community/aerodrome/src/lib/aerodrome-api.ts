export const AERODROME_API = {
  DEFILLAMA_PROTOCOL: 'https://api.llama.fi/protocol/aerodrome',
  DEFILLAMA_CHAINS: 'https://api.llama.fi/v2/chains',
  COINGECKO_PRICE:
    'https://api.coingecko.com/api/v3/simple/price?ids=aerodrome-finance&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',
  DEFILLAMA_YIELDS: 'https://yields.llama.fi/pools',
} as const;

export const AERODROME_PROJECT_ID = 'aerodrome-v2';
export const BASE_CHAIN_NAME = 'Base';
