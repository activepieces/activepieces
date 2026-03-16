import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl } from '../liquity-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Liquity total value locked (TVL) from DeFiLlama, including 24h/7d change and chain breakdown.',
  props: {},
  async run() {
    return await getProtocolTvl();
  },
});
