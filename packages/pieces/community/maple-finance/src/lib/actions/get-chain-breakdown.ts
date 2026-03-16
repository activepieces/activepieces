import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown for Maple Finance by blockchain (Ethereum, Solana, etc.) via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];

    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      total_chains: chains.length,
      chains_supported: chains,
      tvl_by_chain: breakdown,
      total_tvl: breakdown.reduce((sum, item) => sum + item.tvl_usd, 0),
    };
  },
});
