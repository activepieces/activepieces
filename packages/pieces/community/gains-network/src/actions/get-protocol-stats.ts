import { createAction } from '@activepieces/pieces-framework';
import { fetchGainsProtocol } from '../gains-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch general protocol stats for Gains Network: name, description, category, chains, and current TVL.',
  props: {},
  async run() {
    const data = await fetchGainsProtocol();
    return {
      name: data.name,
      description: data.description,
      category: data.category,
      chains: data.chains,
      tvl: data.tvl,
    };
  },
});
