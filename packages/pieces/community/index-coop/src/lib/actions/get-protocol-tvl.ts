import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Index Coop total value locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/index-coop');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    const data = await response.json();

    const currentTvl = data.tvl?.length > 0 ? data.tvl[data.tvl.length - 1].totalLiquidityUSD : 0;
    const prevTvl = data.tvl?.length > 1 ? data.tvl[data.tvl.length - 2].totalLiquidityUSD : currentTvl;
    const tvlChange24h = prevTvl > 0 ? ((currentTvl - prevTvl) / prevTvl) * 100 : 0;

    const chainTvls = {};
    if (data.chainTvls) {
      for (const [chain, chainData] of Object.entries(data.chainTvls)) {
        if (chainData.tvl?.length > 0) {
          chainTvls[chain] = chainData.tvl[chainData.tvl.length - 1].totalLiquidityUSD;
        }
      }
    }

    return {
      totalTvl: currentTvl,
      tvlChange24h: parseFloat(tvlChange24h.toFixed(2)),
      chainTvls,
      protocol: data.name || 'Index Coop',
      category: data.category || 'Index',
    };
  },
});
