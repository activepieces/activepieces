import { createAction } from '@activepieces/pieces-framework';
import { getWoofiProtocol } from '../common/woofi-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get WOOFi protocol metadata including name, category, chains, and description',
  props: {},
  async run() {
    const data = await getWoofiProtocol();
    return {
      name: data.name,
      category: data.category,
      chains: data.chains,
      url: data.url,
      description: data.description,
      symbol: data.symbol,
      twitter: data.twitter,
    };
  },
});
