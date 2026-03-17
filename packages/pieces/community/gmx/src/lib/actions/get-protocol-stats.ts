import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get a combined summary of GMX protocol and token statistics',
  props: {},
  async run() {
    const [protocolRes, priceRes] = await Promise.all([
      fetch('https://api.llama.fi/protocol/gmx'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=gmx&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'),
    ]);
    if (!protocolRes.ok) throw new Error(`DeFiLlama API error: ${protocolRes.status}`);
    if (!priceRes.ok) throw new Error(`CoinGecko API error: ${priceRes.status}`);
    const protocol = await protocolRes.json();
    const prices = await priceRes.json();
    const gmxPrice = prices['gmx'];
    return {
      protocol: {
        name: protocol.name,
        totalTvl: protocol.tvl?.[protocol.tvl.length - 1]?.totalLiquidityUSD ?? 0,
        change1h: protocol.change_1h,
        change1d: protocol.change_1d,
        change7d: protocol.change_7d,
        chains: Object.keys(protocol.currentChainTvls ?? {}),
      },
      token: {
        price_usd: gmxPrice['usd'],
        price_change_24h: gmxPrice['usd_24h_change'],
        market_cap_usd: gmxPrice['usd_market_cap'],
        volume_24h_usd: gmxPrice['usd_24h_vol'],
      },
    };
  },
});