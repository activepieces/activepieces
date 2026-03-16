import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/optimism-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key stats for Optimism protocol: TVL, chains, category, and metadata from DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl('https://api.llama.fi/protocol/optimism');

    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) ?? {};
    const chains = Object.keys(currentChainTvls);

    return {
      name: data['name'] ?? 'Optimism',
      symbol: data['symbol'] ?? 'OP',
      category: data['category'] ?? null,
      chains,
      chainCount: chains.length,
      currentTvlUsd: (data['tvl'] as number) ?? null,
      allChainTvls: currentChainTvls,
      description: data['description'] ?? null,
      url: data['url'] ?? 'https://www.optimism.io',
      twitter: data['twitter'] ?? null,
      source: 'DeFiLlama',
    };
  },
});
