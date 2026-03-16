import { createAction, Property } from '@activepieces/pieces-framework';
import { DEFILLAMA_API_BASE } from '../common/paraswap-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch ParaSwap total value locked (TVL) from DeFiLlama',
  props: {},
  async run(context) {
    const response = await fetch(`${DEFILLAMA_API_BASE}/protocol/paraswap`);
    const data = await response.json() as any;

    const chainTvls: Record<string, number> = {};
    if (data.chainTvls) {
      for (const [chain, tvlData] of Object.entries(data.chainTvls as Record<string, any>)) {
        if (tvlData.tvl && tvlData.tvl.length > 0) {
          chainTvls[chain] = tvlData.tvl[tvlData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
        }
      }
    }

    return {
      name: data.name,
      symbol: data.symbol,
      totalTvl: data.tvl,
      chainTvls,
      chains: data.chains || [],
      category: data.category,
      description: data.description,
      url: data.url,
    };
  },
});
