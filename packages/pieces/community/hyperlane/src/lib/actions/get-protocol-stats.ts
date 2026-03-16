import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for Hyperlane including TVL, chain count, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hyperlane',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlData = data['tvl'] as TvlDataPoint[] | undefined;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, val) => sum + val, 0)
      : 0;

    let tvl7dChange = 0;
    let tvl30dChange = 0;
    if (tvlData && tvlData.length > 1) {
      const now = Math.floor(Date.now() / 1000);
      const cutoff7d = now - 7 * 24 * 60 * 60;
      const cutoff30d = now - 30 * 24 * 60 * 60;
      const latest = tvlData[tvlData.length - 1]?.totalLiquidityUSD ?? 0;
      const point7d = [...tvlData].reverse().find((p) => p.date <= cutoff7d);
      const point30d = [...tvlData].reverse().find((p) => p.date <= cutoff30d);
      if (point7d && point7d.totalLiquidityUSD > 0) {
        tvl7dChange = Math.round(((latest - point7d.totalLiquidityUSD) / point7d.totalLiquidityUSD) * 10000) / 100;
      }
      if (point30d && point30d.totalLiquidityUSD > 0) {
        tvl30dChange = Math.round(((latest - point30d.totalLiquidityUSD) / point30d.totalLiquidityUSD) * 10000) / 100;
      }
    }

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      total_tvl_usd: totalTvl,
      chain_count: chains?.length ?? 0,
      chains: chains,
      tvl_change_7d_percent: tvl7dChange,
      tvl_change_30d_percent: tvl30dChange,
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
    };
  },
});
