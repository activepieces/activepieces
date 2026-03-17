import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Tensor including current TVL, chains, category, and 30-day TVL change from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tensor',
    });
    const data = response.body;
    const tvlArr = (data['tvl'] as TvlDataPoint[]) ?? [];
    const cutoff30d = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const filtered30d = tvlArr.filter((p) => p.date >= cutoff30d);
    const currentTvl = (data['tvl'] as number | undefined) ?? 0;
    let tvlChange30dPct: number | null = null;
    if (filtered30d.length > 1) {
      const oldest = filtered30d[0].totalLiquidityUSD;
      const newest = filtered30d[filtered30d.length - 1].totalLiquidityUSD;
      if (oldest > 0) {
        tvlChange30dPct = ((newest - oldest) / oldest) * 100;
      }
    }
    return {
      name: data['name'],
      slug: data['slug'],
      category: data['category'],
      chains: data['chains'],
      current_tvl_usd: currentTvl,
      tvl_change_30d_pct: tvlChange30dPct !== null ? Number(tvlChange30dPct.toFixed(2)) : null,
      description: data['description'],
      website: data['url'],
      twitter: data['twitter'],
      audits: data['audits'],
      forked_from: data['forkedFrom'],
    };
  },
});
