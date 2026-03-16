import { createAction } from '@activepieces/pieces-framework';
import { getCosmosProtocolStats } from '../lib/cosmos-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for Cosmos Hub including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    return getCosmosProtocolStats();
  },
});
