import { createAction } from '@activepieces/pieces-framework';
import { getOlympusProtocol } from '../olympus-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current total value locked in Olympus DAO protocol treasury',
  auth: undefined,
  props: {},
  async run() {
    const data = await getOlympusProtocol();
    return { tvl: data.tvl, name: data.name, chains: data.chains, description: data.description };
  },
});
