import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl } from '../swell-api';

export const getProtocolTvlAction = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for Swell Network from DeFiLlama, including protocol name, TVL in USD, and supported chains.',
  props: {},
  async run() {
    return await getProtocolTvl();
  },
});
