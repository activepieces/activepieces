import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, CARDANO_SLUG } from '../common/cardano-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Retrieve the last 30 days of historical TVL data for Cardano from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaGet(`/protocol/${CARDANO_SLUG}`);
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const last30 = tvlHistory.slice(-30);
    return {
      protocol: data.name,
      history: last30.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      })),
    };
  },
});
