import { createAction } from '@activepieces/pieces-framework';
import { convexRequest, DEFILLAMA_BASE_URL } from '../common/convex-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch Convex Finance protocol statistics including TVL, chain breakdown, and metadata via DeFiLlama',
  props: {},
  async run() {
    const data = await convexRequest<any>(`${DEFILLAMA_BASE_URL}/protocol/convex-finance`);
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      tvl: data.currentChainTvls,
      totalTvl: data.tvl ? data.tvl[data.tvl.length - 1]?.totalLiquidityUSD : null,
      chainTvls: data.chainTvls,
      category: data.category,
      chains: data.chains,
      url: data.url,
      twitter: data.twitter,
      raw: data,
    };
  },
});
