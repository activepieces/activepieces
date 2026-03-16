import { createAction } from '@activepieces/pieces-framework';
import { fetchChainTvl } from '../lib/stargate-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get Chain TVL',
  description: 'Get Stargate Finance total value locked (TVL) broken down per blockchain from DeFiLlama.',
  props: {},
  async run() {
    return await fetchChainTvl();
  },
});
