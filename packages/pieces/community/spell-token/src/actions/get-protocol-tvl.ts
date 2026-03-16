import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl as fetchProtocolTvl } from '../spell-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the total value locked (TVL) for the Abracadabra Money protocol from DeFiLlama.',
  props: {},
  async run() {
    return await fetchProtocolTvl();
  },
});
