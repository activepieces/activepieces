import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of TVL history for the Flux protocol from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of history to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const response = await httpClient.sendRequest<TvlEntry[]>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/v2/historicalChainTvl/flux',
    });
    // Fallback: try protocol endpoint for historical data
    const protocolResponse = await httpClient.sendRequest<{
      tvl?: TvlEntry[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/flux',
    });
    const tvlArray: TvlEntry[] = protocolResponse.body.tvl ?? response.body ?? [];
    const cutoffTs = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlArray.filter((entry) => entry.date >= cutoffTs);
    return {
      protocol: 'flux',
      days,
      history: filtered,
      count: filtered.length,
      source: 'DeFiLlama',
    };
  },
});
