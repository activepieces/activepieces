import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../camelot-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get general stats for Camelot DEX: name, description, category, chains, and current TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const tvl = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const sorted = [...tvl].sort((a, b) => b.date - a.date);
    const currentTvl = sorted[0]?.totalLiquidityUSD ?? 0;

    return {
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      chains: data.chains,
      currentTvl,
    };
  },
});
