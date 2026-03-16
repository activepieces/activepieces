import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl as fetchTvl } from '../pickle-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for Pickle Finance from DeFiLlama, including 1h/1d/7d changes and previous period snapshots.',
  props: {},
  async run() {
    const data = await fetchTvl();
    return {
      name: data.name,
      tvl: data.tvl,
      tvlPrevDay: data.tvlPrevDay,
      tvlPrevWeek: data.tvlPrevWeek,
      tvlPrevMonth: data.tvlPrevMonth,
      change_1h: data.change_1h,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
      chains: data.chains,
      category: data.category,
      url: data.url,
    };
  },
});
