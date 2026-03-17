import { createAction } from '@activepieces/pieces-framework';
import { getDefiLlamaProtocol } from '../port-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Port Finance including TVL, chains, category, and audit information from DeFiLlama.',
  props: {},
  async run() {
    const data = await getDefiLlamaProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const latestTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : data.tvl;
    const prevDay =
      tvlHistory.length > 1
        ? tvlHistory[tvlHistory.length - 2].totalLiquidityUSD
        : null;
    const tvlChange1d =
      prevDay && latestTvl
        ? (((latestTvl - prevDay) / prevDay) * 100).toFixed(2)
        : null;
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains,
      chain_count: (data.chains ?? []).length,
      current_tvl_usd: latestTvl,
      tvl_change_1d_pct: tvlChange1d ? parseFloat(tvlChange1d) : null,
      audits: data.audits,
      audit_links: data.audit_links,
      github: data.github,
      url: data.url,
      twitter: data.twitter,
      gecko_id: data.gecko_id,
    };
  },
});
