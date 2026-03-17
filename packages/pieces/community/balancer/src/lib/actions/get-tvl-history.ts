import { createAction, Property } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../balancer-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history', displayName: 'Get TVL History',
  description: 'Returns the historical TVL data for Balancer.',
  props: {
    limit: Property.Number({displayName: 'Number of Data Points', description: 'How many historical data points to return (default: 30)', required: false, defaultValue: 30}),
  },
  async run(context) {
    const data = await getProtocolData();
    const limit = context.propsValue.limit ?? 30;
    const history = (data.tvlList || []).slice(-limit).map(point => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date, tvl: point.totalLiquidityUSD, tvlFormatted: formatUSD(point.totalLiquidityUSD),
    }));
    return {dataPoints: history.length, history};
  },
});
