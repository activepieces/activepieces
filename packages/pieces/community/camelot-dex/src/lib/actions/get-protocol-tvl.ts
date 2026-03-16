import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../camelot-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Camelot DEX Total Value Locked (TVL) including daily and weekly changes from DeFiLlama.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const tvl = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const sorted = [...tvl].sort((a, b) => b.date - a.date);

    const current = sorted[0]?.totalLiquidityUSD ?? 0;
    const prevDay = sorted[1]?.totalLiquidityUSD ?? 0;
    const prevWeek = sorted[7]?.totalLiquidityUSD ?? 0;

    const change1d = prevDay > 0 ? ((current - prevDay) / prevDay) * 100 : 0;
    const change7d = prevWeek > 0 ? ((current - prevWeek) / prevWeek) * 100 : 0;

    return {
      tvl: current,
      prevDay,
      prevWeek,
      change_1d: parseFloat(change1d.toFixed(2)),
      change_7d: parseFloat(change7d.toFixed(2)),
    };
  },
});
