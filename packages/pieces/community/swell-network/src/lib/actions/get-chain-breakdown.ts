import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown } from '../swell-api';

export const getChainBreakdownAction = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetches TVL breakdown by chain for Swell Network from DeFiLlama, sorted by TVL descending with percentage of total TVL.',
  props: {},
  async run() {
    return await getChainBreakdown();
  },
});
