import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../blast-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Retrieve key statistics for the Blast protocol from DeFiLlama, including TVL, supported chains, category, and metadata.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/blast');
    const currentChainTvls = (data as any).currentChainTvls ?? {};
    const totalTvl = Object.values(currentChainTvls).reduce(
      (acc, v) => acc + Number(v),
      0
    );
    const allTvl: Array<{ date: number; totalLiquidityUSD: number }> =
      (data as any).tvl ?? [];
    const latestEntry = allTvl.length > 0 ? allTvl[allTvl.length - 1] : null;

    return {
      name: (data as any).name,
      symbol: (data as any).symbol,
      category: (data as any).category,
      description: (data as any).description,
      chains: (data as any).chains ?? [],
      chainCount: ((data as any).chains ?? []).length,
      totalTvlUsd: totalTvl,
      latestTvlDataPoint: latestEntry
        ? {
            date: new Date(latestEntry.date * 1000).toISOString().split('T')[0],
            tvlUsd: latestEntry.totalLiquidityUSD,
          }
        : null,
      audits: (data as any).audits ?? null,
      twitter: (data as any).twitter ?? null,
      url: (data as any).url ?? null,
      gecko_id: (data as any).gecko_id ?? null,
    };
  },
});
