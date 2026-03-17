import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Solend including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/solend',
    });

    const data = response.body as any;
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];
    const latestTvlEntry = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const chains = Object.keys(currentChainTvls);

    return {
      name: data.name,
      slug: data.slug,
      symbol: data.symbol,
      category: data.category,
      chain: data.chain,
      chains,
      chainCount: chains.length,
      currentTvlUSD: latestTvlEntry ? latestTvlEntry.totalLiquidityUSD : null,
      tvlByChain: currentChainTvls,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      gecko_id: data.gecko_id,
    };
  },
});
