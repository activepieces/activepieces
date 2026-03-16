import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../taiko-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the Taiko ZK-EVM rollup including TVL, chains, category, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/taiko');
    const tvlEntries: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const latestTvl =
      tvlEntries.length > 0
        ? tvlEntries[tvlEntries.length - 1].totalLiquidityUSD
        : null;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      chains: data.chains ?? [],
      chainCount: (data.chains ?? []).length,
      currentChainTvls: data.currentChainTvls ?? {},
      latestTvlUsd: latestTvl,
      tvlDataPoints: tvlEntries.length,
      website: data.url,
      twitter: data.twitter,
      listedAt: data.listedAt
        ? new Date(data.listedAt * 1000).toISOString()
        : null,
    };
  },
});
