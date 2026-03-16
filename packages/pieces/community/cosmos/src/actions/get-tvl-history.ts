import { createAction } from '@activepieces/pieces-framework';
import { getCosmosTvlHistory } from '../lib/cosmos-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the historical TVL data for Cosmos Hub over the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    return getCosmosTvlHistory();
  },
});
