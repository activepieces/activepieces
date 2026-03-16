import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for Meteora including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/meteora',
    });

    const data = response.body as any;
    const tvlArr: { date: number; totalLiquidityUSD: number }[] = data.tvl ?? [];
    const latest = tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;
    const dayAgo = tvlArr.length > 1 ? tvlArr[tvlArr.length - 2] : null;
    const weekAgo = tvlArr.length > 7 ? tvlArr[tvlArr.length - 8] : null;
    const monthAgo = tvlArr.length > 30 ? tvlArr[tvlArr.length - 31] : null;

    const currentTvl = latest?.totalLiquidityUSD ?? null;
    const change1d = currentTvl !== null && dayAgo
      ? parseFloat((((currentTvl - dayAgo.totalLiquidityUSD) / dayAgo.totalLiquidityUSD) * 100).toFixed(2))
      : null;
    const change7d = currentTvl !== null && weekAgo
      ? parseFloat((((currentTvl - weekAgo.totalLiquidityUSD) / weekAgo.totalLiquidityUSD) * 100).toFixed(2))
      : null;
    const change30d = currentTvl !== null && monthAgo
      ? parseFloat((((currentTvl - monthAgo.totalLiquidityUSD) / monthAgo.totalLiquidityUSD) * 100).toFixed(2))
      : null;

    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const chainList = Object.keys(currentChainTvls);

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      currentTvlUSD: currentTvl,
      tvlChange1dPercent: change1d,
      tvlChange7dPercent: change7d,
      tvlChange30dPercent: change30d,
      chainCount: chainList.length,
      chains: chainList,
      currentChainTvls: currentChainTvls,
      gecko_id: data.gecko_id,
      cmcId: data.cmcId,
      lastUpdated: latest ? new Date(latest.date * 1000).toISOString() : null,
    };
  },
});
