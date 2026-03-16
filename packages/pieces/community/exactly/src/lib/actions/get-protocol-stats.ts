import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Retrieve key statistics for Exactly Protocol including TVL, category, chains, and metadata from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name?: string;
      symbol?: string;
      description?: string;
      category?: string;
      chains?: string[];
      currentChainTvls?: Record<string, number>;
      tvl?: Array<{ date: number; totalLiquidityUSD: number }>;
      url?: string;
      twitter?: string;
      gecko_id?: string;
      cmcId?: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/exactly',
    });

    const data = response.body;
    const tvlArray = data.tvl ?? [];
    const latestTvl = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      chains: data.chains ?? [],
      totalChains: (data.chains ?? []).length,
      currentTvlUsd: latestTvl ? latestTvl.totalLiquidityUSD : null,
      currentChainTvls: data.currentChainTvls ?? {},
      url: data.url,
      twitter: data.twitter,
      geckoId: data.gecko_id,
      cmcId: data.cmcId,
    };
  },
});
