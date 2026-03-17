import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTVL } from '../compound-finance-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for Compound Finance with 1h, 1d, and 7d changes.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getProtocolTVL();
    return {
      name: data.name,
      symbol: data.symbol,
      tvl_usd: data.tvl,
      change_1h_percent: data.change_1h,
      change_1d_percent: data.change_1d,
      change_7d_percent: data.change_7d,
      chains: data.chains,
      url: data.url,
      logo: data.logo,
    };
  },
});
