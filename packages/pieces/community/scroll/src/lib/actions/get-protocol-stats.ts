import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../scroll-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Scroll protocol from DeFiLlama: TVL, supported chains, category, description, and token info.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/scroll');

    const d = data as any;

    const currentChainTvls: Record<string, number> = d?.currentChainTvls ?? {};
    const chains = Object.keys(currentChainTvls);
    const totalTvl = Object.values(currentChainTvls).reduce(
      (sum: number, v: number) => sum + v,
      0
    );

    const tvlHistory: { date: number; totalLiquidityUSD: number }[] = d?.tvl ?? [];
    const last7 = tvlHistory.slice(-7);
    const tvl7dAgo =
      last7.length > 0 ? last7[0].totalLiquidityUSD : 0;
    const change7d =
      tvl7dAgo > 0 ? ((totalTvl - tvl7dAgo) / tvl7dAgo) * 100 : 0;

    return {
      name: d?.name ?? 'Scroll',
      slug: d?.slug ?? 'scroll',
      description: d?.description ?? '',
      category: d?.category ?? '',
      chains,
      chainCount: chains.length,
      symbol: d?.symbol ?? 'SCR',
      currentTvlUsd: totalTvl,
      change7dPercent: Math.round(change7d * 100) / 100,
      url: d?.url ?? 'https://scroll.io',
      twitter: d?.twitter ?? 'Scroll_ZKP',
      listedAt: d?.listedAt
        ? new Date((d.listedAt as number) * 1000).toISOString()
        : null,
    };
  },
});
