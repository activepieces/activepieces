import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Helium total value locked with percentage changes',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/helium');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const data = await response.json();
    return {
      name: data.name,
      tvl: data.currentChainTvls,
      totalTvl: data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? 0,
      change1h: data.change_1h,
      change1d: data.change_1d,
      change7d: data.change_7d,
    };
  },
});
