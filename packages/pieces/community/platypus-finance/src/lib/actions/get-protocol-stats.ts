import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../platypus-finance-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Platypus Finance protocol metadata: name, description, category, chains',
  props: {},
  async run() {
    const data = await getProtocolData();
    return { name: data.name, description: data.description, category: data.category, chains: data.chains, currentTvl: data.tvl };
  },
});
