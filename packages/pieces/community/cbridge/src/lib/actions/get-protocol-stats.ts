import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, CBRIDGE_SLUG } from '../common/defillama-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name: string;
  symbol: string;
  category: string;
  url: string;
  twitter: string;
  currentChainTvls: Record<string, number>;
  audit_links?: string[];
  [key: string]: unknown;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for Celer cBridge: TVL, chain count, 7-day & 30-day TVL change, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaGet<ProtocolResponse>(
      `/protocol/${CBRIDGE_SLUG}`
    );

    const tvlHistory: TvlDataPoint[] = (data['tvl'] as TvlDataPoint[]) ?? [];
    const now = Math.floor(Date.now() / 1000);
    const day7Ago = now - 7 * 86400;
    const day30Ago = now - 30 * 86400;

    const latestTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : 0;

    function findClosest(ts: number): number {
      if (tvlHistory.length === 0) return 0;
      let best = tvlHistory[0];
      for (const pt of tvlHistory) {
        if (Math.abs(pt.date - ts) < Math.abs(best.date - ts)) best = pt;
      }
      return best.totalLiquidityUSD;
    }

    const tvl7dAgo = findClosest(day7Ago);
    const tvl30dAgo = findClosest(day30Ago);

    const change7d =
      tvl7dAgo > 0
        ? Number((((latestTvl - tvl7dAgo) / tvl7dAgo) * 100).toFixed(2))
        : null;
    const change30d =
      tvl30dAgo > 0
        ? Number((((latestTvl - tvl30dAgo) / tvl30dAgo) * 100).toFixed(2))
        : null;

    const chainTvls = data.currentChainTvls ?? {};
    const chainCount = Object.keys(chainTvls).length;

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      url: data.url,
      twitter: data.twitter,
      current_tvl_usd: latestTvl,
      chain_count: chainCount,
      tvl_change_7d_pct: change7d,
      tvl_change_30d_pct: change30d,
      audit_links: data.audit_links ?? [],
    };
  },
});
