import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolTvl } from '../lib/stargate-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Stargate Finance total value locked (TVL) across all chains from DeFiLlama.',
  props: {},
  async run() {
    return await fetchProtocolTvl();
  },
});
