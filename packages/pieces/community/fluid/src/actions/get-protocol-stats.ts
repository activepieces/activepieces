import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/fluid-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Fluid protocol key statistics including TVL, chains, category, and 24h/7d changes from DeFiLlama.',
  props: {},
  async run() {
    const data = await makeRequest('/protocol/fluid');
    return {
      name: data.name,
      category: data.category,
      tvl: data.tvl,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
      change_1m: data.change_1m,
      chains: data.chains,
      chain_count: data.chains?.length || 0,
      audits: data.audits,
      url: data.url,
      twitter: data.twitter,
      forkedFrom: data.forkedFrom,
    };
  },
});
