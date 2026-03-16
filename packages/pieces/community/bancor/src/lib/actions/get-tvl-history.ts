import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BANCOR_URL } from '../bancor-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 days of Bancor TVL history from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_BANCOR_URL,
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
