import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../sushiswap-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get SushiSwap protocol stats: name, description, category, chains, and current TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();

    return {
      name: data.name ?? 'SushiSwap',
      description: data.description ?? null,
      category: data.category ?? null,
      chains: data.chains ?? [],
      tvl: data.tvl ?? null,
    };
  },
});
