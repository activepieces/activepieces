import { createAction } from '@activepieces/pieces-framework';
import { getTvlHistory as fetchTvlHistory } from '../badger-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Returns the last 30 days of TVL history for Badger DAO, with daily date and total liquidity in USD, from DeFiLlama.',
  props: {},
  async run() {
    const history = await fetchTvlHistory();
    return {
      history,
      days: history.length,
      latestTvl: history.length > 0 ? history[history.length - 1].totalLiquidityUSD : null,
      oldestDate: history.length > 0 ? history[0].date : null,
      latestDate: history.length > 0 ? history[history.length - 1].date : null,
      source: 'DeFiLlama',
    };
  },
});
