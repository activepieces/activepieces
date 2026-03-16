import { createAction } from '@activepieces/pieces-framework';
import { getAxelarProtocol } from '../axelar-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current total value locked in the Axelar Network protocol via DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAxelarProtocol();
    return {
      tvl: data.tvl,
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      chains: data.chains,
      category: data.category,
    };
  },
});
