import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, ACROSS_DEFILLAMA_SLUG } from '../common';

export const getChainBreakdown = createAction({
  auth: PieceAuth.None(),
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get Across Protocol TVL distribution across all supported blockchains via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${ACROSS_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls)
          .map(([chain, tvl]) => ({ chain, tvl }))
          .sort((a, b) => b.tvl - a.tvl)
      : [];

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvl, 0);

    return {
      chains: chains ?? [],
      chainCount: chains?.length ?? 0,
      breakdown,
      totalTvl,
      topChain: breakdown[0] ?? null,
    };
  },
});
