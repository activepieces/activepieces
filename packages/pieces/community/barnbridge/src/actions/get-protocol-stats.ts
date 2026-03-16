import { createAction } from '@activepieces/pieces-framework';
import { fetchBarnBridgeProtocol } from '../barnbridge-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get general protocol statistics for BarnBridge including name, description, category, supported chains, and current TVL.',
  props: {},
  async run() {
    const data = await fetchBarnBridgeProtocol();

    return {
      name: data.name ?? null,
      description: data.description ?? null,
      category: data.category ?? null,
      chains: data.chains ?? [],
      tvl: data.tvl ?? null,
    };
  },
});
