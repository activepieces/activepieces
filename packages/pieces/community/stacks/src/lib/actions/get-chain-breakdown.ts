import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Stacks protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stacks',
    });
    const data = response.body as any;
    const currentChainTvls: Record<string, number> = data['currentChainTvls'] || {};
    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));
    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);
    return {
      protocol: data['name'],
      chains: data['chains'],
      breakdown,
      total_tvl: Object.values(currentChainTvls).reduce((a: number, b: number) => a + b, 0),
    };
  },
});
