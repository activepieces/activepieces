import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown } from '../liquity-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch chain-by-chain TVL breakdown for Liquity from DeFiLlama. Liquity is primarily deployed on Ethereum.',
  props: {},
  async run() {
    return await getChainBreakdown();
  },
});
