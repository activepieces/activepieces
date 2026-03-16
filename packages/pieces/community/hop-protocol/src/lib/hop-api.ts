export const HOP_API_URLS = {
  PROTOCOL_TVL: 'https://api.llama.fi/protocol/hop-protocol',
  CHAIN_TVL: 'https://api.llama.fi/tvl/hop-protocol',
  BRIDGE_VOLUME: 'https://api.llama.fi/summary/bridges/hop',
  YIELDS_POOLS: 'https://yields.llama.fi/pools',
  HOP_PRICE:
    'https://api.coingecko.com/api/v3/simple/price?ids=hop-protocol&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',
} as const;

export const HOP_PROJECT_ID = 'hop-protocol';
