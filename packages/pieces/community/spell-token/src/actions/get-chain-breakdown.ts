import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown as fetchChainBreakdown } from '../spell-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Returns the TVL breakdown of Abracadabra Money across all supported chains, sorted by TVL descending.',
  props: {},
  async run() {
    return await fetchChainBreakdown();
  },
});
