import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../klaytn-api';

export const getProtocolStatsAction = createAction({
  auth: undefined,
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key DeFi protocol stats for Klaytn including TVL, category, chains, and description from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchDefiLlama<{
      name: string;
      symbol: string;
      category: string;
      chains: string[];
      tvl: number;
      currentChainTvls: Record<string, number>;
      description?: string;
      url?: string;
    }>('/protocol/klaytn');
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains,
      chain_count: data.chains?.length ?? 0,
      tvl_usd: data.tvl,
      current_chain_tvls: data.currentChainTvls,
      description: data.description,
      url: data.url,
    };
  },
});
