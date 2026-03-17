import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name: string;
  description: string;
  url: string;
  twitter: string;
  category: string;
  chains: string[];
  tvl: TvlEntry[];
  chainTvls: Record<string, { tvl: TvlEntry[] }>;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key statistics for Invariant from DeFiLlama including current TVL, 7-day change, 30-day change, and all-time high.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/invariant',
    });

    const data = response.body;
    const tvlHistory = data.tvl ?? [];

    const currentTvl = tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
      : 0;

    const tvl7dAgo = tvlHistory.length >= 7
      ? tvlHistory[tvlHistory.length - 7].totalLiquidityUSD
      : null;

    const tvl30dAgo = tvlHistory.length >= 30
      ? tvlHistory[tvlHistory.length - 30].totalLiquidityUSD
      : null;

    const allTimeHigh = tvlHistory.reduce(
      (max: number, entry: TvlEntry) => Math.max(max, entry.totalLiquidityUSD),
      0
    );

    const change7d = tvl7dAgo
      ? ((currentTvl - tvl7dAgo) / tvl7dAgo) * 100
      : null;

    const change30d = tvl30dAgo
      ? ((currentTvl - tvl30dAgo) / tvl30dAgo) * 100
      : null;

    return {
      protocol: data.name,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      category: data.category,
      chains: data.chains,
      current_tvl_usd: currentTvl,
      tvl_7d_change_pct: change7d !== null ? parseFloat(change7d.toFixed(2)) : null,
      tvl_30d_change_pct: change30d !== null ? parseFloat(change30d.toFixed(2)) : null,
      all_time_high_tvl_usd: allTimeHigh,
      data_points_total: tvlHistory.length,
    };
  },
});
