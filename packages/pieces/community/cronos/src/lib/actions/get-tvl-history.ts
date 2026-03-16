import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Cronos from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cronos',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<Record<string, unknown>> | undefined;
    if (!tvlArr) {
      return { history: [], count: 0 };
    }
    const cutoff = Date.now() / 1000 - 30 * 24 * 60 * 60;
    const last30 = tvlArr
      .filter((entry) => (entry['date'] as number) >= cutoff)
      .map((entry) => ({
        date: new Date((entry['date'] as number) * 1000).toISOString().split('T')[0],
        tvl: entry['totalLiquidityUSD'],
      }));
    return {
      history: last30,
      count: last30.length,
      latestTvl: last30.length > 0 ? last30[last30.length - 1]['tvl'] : null,
    };
  },
});
