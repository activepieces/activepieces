import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../sudoswap-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get a concise summary of Sudoswap key stats: current TVL, supported chains, category, and audit info from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/sudoswap');

    const latestTvl = data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? null;
    const tvlSeries: number[] = (data.tvl ?? []).map(
      (e: { totalLiquidityUSD: number }) => e.totalLiquidityUSD
    );
    const allTimeHighTvl = tvlSeries.length > 0 ? Math.max(...tvlSeries) : null;

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains ?? [],
      chainCount: (data.chains ?? []).length,
      currentTvlUSD: latestTvl,
      allTimeHighTvlUSD: allTimeHighTvl,
      currentChainTvls: data.currentChainTvls ?? {},
      twitter: data.twitter ?? null,
      github: data.github ?? null,
      listedAt: data.listedAt
        ? new Date(data.listedAt * 1000).toISOString().split('T')[0]
        : null,
      audits: data.audits ?? null,
      url: data.url ?? null,
    };
  },
});
