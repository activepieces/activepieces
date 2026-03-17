import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchEigenLayerProtocol, parseTvlHistory } from '../eigenlayer-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetches historical TVL data for EigenLayer with configurable time range.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical TVL data to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const protocol = await fetchEigenLayerProtocol();
    const history = parseTvlHistory(protocol.tvl_array, days);

    const firstTvl = history[0]?.tvl ?? 0;
    const lastTvl = history[history.length - 1]?.tvl ?? 0;
    const totalChange =
      firstTvl > 0
        ? Math.round(((lastTvl - firstTvl) / firstTvl) * 10000) / 100
        : 0;

    return {
      days_requested: days,
      data_points: history.length,
      tvl_start: firstTvl,
      tvl_end: lastTvl,
      total_change_percent: totalChange,
      history,
    };
  },
});
