import { createAction } from '@activepieces/pieces-framework';
import { getBeethovenProtocol } from '../common/beethoven-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Beethoven X protocol Total Value Locked (TVL) and changes over time.',
  props: {},
  async run() {
    const data = await getBeethovenProtocol();

    const currentTvl = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const latest = currentTvl?.[currentTvl.length - 1];
    const prev24h = currentTvl?.[currentTvl.length - 2];
    const prev7d = currentTvl?.[currentTvl.length - 8];
    const prev30d = currentTvl?.[currentTvl.length - 31];

    const pctChange = (current: number, previous: number | undefined) =>
      previous && previous !== 0
        ? (((current - previous) / previous) * 100).toFixed(2)
        : null;

    return {
      tvl: latest?.totalLiquidityUSD ?? data.currentChainTvls,
      tvlUsd: latest?.totalLiquidityUSD,
      change24h: pctChange(latest?.totalLiquidityUSD, prev24h?.totalLiquidityUSD),
      change7d: pctChange(latest?.totalLiquidityUSD, prev7d?.totalLiquidityUSD),
      change30d: pctChange(latest?.totalLiquidityUSD, prev30d?.totalLiquidityUSD),
      lastUpdated: latest?.date ? new Date(latest.date * 1000).toISOString() : null,
    };
  },
});
