import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Fetch the NFTX TVL broken down by blockchain from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nftx',
    });
    const data = response.body;
    const chainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];

    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      chains_supported: chains,
      chain_count: chains?.length ?? 0,
      breakdown,
      total_tvl_usd: breakdown.reduce((acc, c) => acc + c.tvl_usd, 0),
    };
  },
});
