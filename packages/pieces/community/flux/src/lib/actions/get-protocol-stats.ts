import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name?: string;
  symbol?: string;
  description?: string;
  category?: string;
  chain?: string;
  chains?: string[];
  tvl?: TvlEntry[];
  currentChainTvls?: Record<string, number>;
  url?: string;
  twitter?: string;
  listedAt?: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics and metadata for the Flux protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/flux',
    });
    const data = response.body;
    const tvlArray = data.tvl ?? [];
    const latestTvl = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1]?.totalLiquidityUSD : null;
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
    const tvl30dEntry = tvlArray.find((e) => e.date >= thirtyDaysAgo);
    const tvl30dAgo = tvl30dEntry?.totalLiquidityUSD ?? null;
    const tvlChange30d =
      latestTvl !== null && tvl30dAgo !== null && tvl30dAgo !== 0
        ? (((latestTvl - tvl30dAgo) / tvl30dAgo) * 100).toFixed(2)
        : null;
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      chains: data.chains,
      currentTvlUsd: latestTvl,
      tvlChange30dPercent: tvlChange30d !== null ? parseFloat(tvlChange30d) : null,
      website: data.url,
      twitter: data.twitter,
      source: 'DeFiLlama',
    };
  },
});
