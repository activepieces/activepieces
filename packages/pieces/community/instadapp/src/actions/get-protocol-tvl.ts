import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, DEFILLAMA_BASE } from '../lib/instadapp-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Instadapp total value locked (TVL) across all chains from DeFiLlama.',
  props: {},
  async run() {
    const data = await makeRequest('/protocol/instadapp', DEFILLAMA_BASE);
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
    };
  },
});
