import { createAction } from '@activepieces/pieces-framework';
import { getTvlHistory } from '../liquity-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Liquity from DeFiLlama. Returns an array of date/tvl data points.',
  props: {},
  async run() {
    return await getTvlHistory();
  },
});
