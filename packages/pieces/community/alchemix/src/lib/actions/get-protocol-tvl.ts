import { createAction } from '@activepieces/pieces-framework';
import { getAlchemixProtocol } from '../alchemix-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current total value locked in Alchemix self-repaying loans protocol',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAlchemixProtocol();
    return { tvl: data.tvl, name: data.name, chains: data.chains, description: data.description };
  },
});
