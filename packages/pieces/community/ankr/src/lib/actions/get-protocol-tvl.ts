import { createAction } from '@activepieces/pieces-framework';
import { fetchAnkrProtocol } from '../ankr-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: "Fetch Ankr's Total Value Locked (TVL) from DeFiLlama, including chain breakdown.",
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchAnkrProtocol();

    return {
      name: protocol.name,
      tvl: protocol.tvl,
      chains: protocol.chains,
      change_1h: protocol.change_1h,
      change_1d: protocol.change_1d,
      change_7d: protocol.change_7d,
      category: protocol.category,
      url: protocol.url,
      description: protocol.description,
    };
  },
});
