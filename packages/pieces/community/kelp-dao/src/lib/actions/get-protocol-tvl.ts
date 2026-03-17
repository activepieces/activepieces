import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchKelpProtocol } from '../kelpdao-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetches the current Total Value Locked (TVL) for Kelp DAO from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await fetchKelpProtocol();

    return {
      name: protocol.name,
      tvl: protocol.tvl,
      chains: protocol.chains,
    };
  },
});
