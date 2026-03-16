import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for Li.Fi from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      currentChainTvls: Record<string, number>;
      chains: string[];
      tvl: number;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/li.fi',
    });

    const data = response.body;
    const chainTvls = data.currentChainTvls || {};

    const chainBreakdown = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        percentage: data.tvl > 0 ? Number(((tvl / data.tvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data.name,
      total_tvl: data.tvl,
      chain_count: chainBreakdown.length,
      chains: chainBreakdown,
    };
  },
});
