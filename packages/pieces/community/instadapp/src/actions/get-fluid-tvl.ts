import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, DEFILLAMA_BASE } from '../lib/instadapp-api';

export const getFluidTvl = createAction({
  name: 'get_fluid_tvl',
  displayName: 'Get Fluid TVL',
  description: "Get Fluid (Instadapp's new high-efficiency lending protocol) total value locked from DeFiLlama.",
  props: {},
  async run() {
    const data = await makeRequest('/protocol/fluid', DEFILLAMA_BASE);
    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      currentChainTvls: data.currentChainTvls,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
      change_1m: data.change_1m,
      url: data.url,
      description: data.description,
      chains: data.chains,
      category: data.category,
    };
  },
});
