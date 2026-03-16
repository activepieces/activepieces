import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../quickswap-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get QuickSwap protocol metadata: name, description, category, chains',
  props: {},
  async run() {
    const data = await getProtocolData();
    return { name: data.name, description: data.description, category: data.category, chains: data.chains, currentTvl: data.tvl };
  },
});
