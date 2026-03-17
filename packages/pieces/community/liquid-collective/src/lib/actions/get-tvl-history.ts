import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchProtocolData, buildTvlHistory } from '../liquid-collective-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch historical TVL data for Liquid Collective with a configurable lookback window.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Lookback Days',
      description: 'Number of days of historical TVL data to retrieve (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const protocol = await fetchProtocolData();
    const history = buildTvlHistory(protocol, days);

    if (history.length === 0) {
      return {
        days,
        dataPoints: 0,
        history: [],
        startTvl: null,
        endTvl: null,
        totalChangePercent: null,
      };
    }

    const startTvl = history[0].tvl;
    const endTvl = history[history.length - 1].tvl;
    const totalChangePercent =
      startTvl > 0 ? parseFloat((((endTvl - startTvl) / startTvl) * 100).toFixed(2)) : 0;

    return {
      days,
      dataPoints: history.length,
      startDate: history[0].date,
      endDate: history[history.length - 1].date,
      startTvl,
      endTvl,
      totalChangePercent,
      totalChangeFormatted: `${totalChangePercent}%`,
      history,
    };
  },
});
