import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../hmx-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get HMX Protocol metadata including name, description, category, chains, and current TVL',
  auth: PieceAuth.None(),
  props: {},
  async run() {
    const data = await getProtocolData();
    return {
      name: data.name,
      description: data.description,
      category: data.category,
      chains: data.chains,
      tvl: data.tvl,
    };
  },
});
