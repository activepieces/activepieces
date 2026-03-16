import { createAction } from '@activepieces/pieces-framework';
import { getWoofiProtocol } from '../common/woofi-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get WOOFi current total value locked and percentage changes',
  props: {},
  async run() {
    const data = await getWoofiProtocol();
    return {
      tvl: data.tvl,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
      change_1m: data.change_1m,
    };
  },
});
