import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { TRUEFI_LLAMA_URL } from '../truefi-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get TrueFi TVL history — last 30 data points with date and totalLiquidityUSD',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: TRUEFI_LLAMA_URL,
    });
    const data = response.body;
    const tvlArray: { date: number; totalLiquidityUSD: number }[] = data.tvl ?? [];
    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));
    return { history: last30 };
  },
});
