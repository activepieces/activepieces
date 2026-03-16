import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../spookyswap-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get SpookySwap historical TVL data (last 30 data points)',
  props: {},
  async run() {
    const data = await getProtocolData();
    const tvl = data.tvl || [];
    return tvl.slice(-30).map((entry: any) => ({ date: new Date(entry.date * 1000).toISOString(), totalLiquidityUSD: entry.totalLiquidityUSD }));
  },
});
