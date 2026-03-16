import { createAction } from '@activepieces/pieces-framework';
import { getTvlHistory as fetchTvlHistory } from '../spell-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Returns the last 30 days of TVL history for the Abracadabra Money protocol, with daily date and USD liquidity values.',
  props: {},
  async run() {
    return await fetchTvlHistory();
  },
});
