import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get TVL breakdown by blockchain for Interlay from DeFiLlama, sorted by TVL descending.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/interlay',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];
    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));
    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);
    const totalTvl = breakdown.reduce((sum, c) => sum + c.tvl_usd, 0);
    return {
      chains,
      chain_breakdown: breakdown,
      total_chains: breakdown.length,
      total_tvl_usd: totalTvl,
    };
  },
});
