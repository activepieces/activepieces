import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown for CoW Protocol across all supported blockchain networks.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cow-protocol',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const chainBreakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({
          chain,
          tvl_usd: tvl,
        }))
      : [];

    chainBreakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data['name'],
      total_chains: chains?.length ?? 0,
      chains: chains,
      chain_tvl_breakdown: chainBreakdown,
    };
  },
});