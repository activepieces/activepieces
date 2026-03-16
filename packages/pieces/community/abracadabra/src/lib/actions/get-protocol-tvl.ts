import { createAction } from '@activepieces/pieces-framework';
import { getAbracadabraProtocol } from '../abracadabra-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current total value locked in Abracadabra Money protocol',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAbracadabraProtocol();
    return {
      tvl: data.tvl,
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      chains: data.chains,
    };
  },
});
