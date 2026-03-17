import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get a combined summary of Arweave chain and AR token statistics',
  props: {},
  async run() {
    const [chainsRes, priceRes] = await Promise.all([
      fetch('https://api.llama.fi/v2/chains'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'),
    ]);
    if (!chainsRes.ok) throw new Error(`DeFiLlama API error: ${chainsRes.status}`);
    if (!priceRes.ok) throw new Error(`CoinGecko API error: ${priceRes.status}`);
    const chains = await chainsRes.json();
    const prices = await priceRes.json();
    const chain = chains.find((c: { name: string }) => c.name === 'Arweave') ?? {};
    const d = prices['arweave'];
    return {
      chain: { name: 'Arweave', tvl: chain.tvl ?? 0, tokenSymbol: chain.tokenSymbol ?? 'AR' },
      token: {
        price_usd: d['usd'],
        price_change_24h: d['usd_24h_change'],
        market_cap_usd: d['usd_market_cap'],
        volume_24h_usd: d['usd_24h_vol'],
      },
    };
  },
});
