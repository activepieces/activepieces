import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch a breakdown of Algorand TVL across individual DeFi protocols tracked by DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/algorand',
    });
    const data = response.body as Record<string, any>;
    const chainTvls: Record<string, any> = data['chainTvls'] ?? {};
    const breakdown: Array<{ chain: string; tvl: number }> = Object.entries(chainTvls).map(
      ([chain, info]: [string, any]) => ({
        chain,
        tvl: Array.isArray(info?.tvl) ? info.tvl[info.tvl.length - 1]?.totalLiquidityUSD ?? 0 : 0,
      })
    );
    breakdown.sort((a, b) => b.tvl - a.tvl);
    return {
      protocol: data['name'],
      chains: data['chains'],
      breakdown,
    };
  },
});
