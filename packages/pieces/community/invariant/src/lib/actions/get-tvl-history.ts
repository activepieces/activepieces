import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface HistoricalTvlResponse {
  date: number;
  tvl: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the TVL history for Invariant over the last 30 days from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<HistoricalTvlResponse[]>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/v2/historicalChainTvl/Solana',
    });

    // Get last 30 days from DeFiLlama protocol-specific historical TVL
    const protocolResponse = await httpClient.sendRequest<{
      tvl: TvlEntry[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/invariant',
    });

    const allTvl = protocolResponse.body.tvl ?? [];
    const last30 = allTvl.slice(-30);

    return {
      protocol: 'Invariant',
      history: last30.map((entry: TvlEntry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      })),
      data_points: last30.length,
    };
  },
});
