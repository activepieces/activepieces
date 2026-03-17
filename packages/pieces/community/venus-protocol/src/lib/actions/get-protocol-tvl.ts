import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../venus-protocol-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Venus Protocol, including 1h, 1d, and 7d changes.',
  props: {},
  async run() {
    const protocol = await getProtocolData();

    return {
      name: protocol.name,
      symbol: protocol.symbol,
      chain: protocol.chain,
      tvl: protocol.tvl,
      change_1h: protocol.change_1h,
      change_1d: protocol.change_1d,
      change_7d: protocol.change_7d,
      category: protocol.category,
      url: protocol.url,
    };
  },
});
