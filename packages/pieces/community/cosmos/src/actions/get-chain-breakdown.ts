import { createAction } from '@activepieces/pieces-framework';
import { getCosmosChainBreakdown } from '../lib/cosmos-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for Cosmos Hub from DeFiLlama.',
  props: {},
  async run() {
    return getCosmosChainBreakdown();
  },
});
