import { createAction } from '@activepieces/pieces-framework';
import { lyraRequest } from '../lyra-api';

export const getOptionsStats = createAction({
  name: 'get_options_stats',
  displayName: 'Get Options Market Stats',
  description: 'Fetch Lyra Finance options market statistics and pool data from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await lyraRequest('https://api.llama.fi/protocol/lyra');
    const pools = (data.pools ?? []) as Array<Record<string, unknown>>;
    const chainTvls: Record<string, unknown> = data.chainTvls ?? {};
    const chains = data.chains ?? [];
    return {
      name: data.name,
      category: data.category,
      chains,
      pool_count: pools.length,
      pools: pools.slice(0, 10),
      chain_tvl_keys: Object.keys(chainTvls),
      total_tvl: data.tvl,
    };
  },
});
