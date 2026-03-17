import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, CARDANO_SLUG } from '../common/cardano-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Retrieve key Cardano protocol statistics: TVL, supported chains, category, and more from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaGet(`/protocol/${CARDANO_SLUG}`);
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const latest = tvlHistory[tvlHistory.length - 1];
    const oldest = tvlHistory[0];
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains,
      chain_count: (data.chains ?? []).length,
      current_tvl: data.tvl,
      current_chain_tvls: data.currentChainTvls,
      latest_record_date: latest
        ? new Date(latest.date * 1000).toISOString().split('T')[0]
        : null,
      tracking_since: oldest
        ? new Date(oldest.date * 1000).toISOString().split('T')[0]
        : null,
      total_tvl_snapshots: tvlHistory.length,
      url: data.url,
    };
  },
});
