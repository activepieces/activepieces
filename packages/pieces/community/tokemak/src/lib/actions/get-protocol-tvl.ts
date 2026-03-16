import { createAction } from '@activepieces/pieces-framework';
import { getTokemakProtocol } from '../tokemak-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current total value locked in Tokemak liquidity protocol',
  auth: undefined,
  props: {},
  async run() {
    const data = await getTokemakProtocol();
    return { tvl: data.tvl, name: data.name, chains: data.chains, description: data.description };
  },
});
