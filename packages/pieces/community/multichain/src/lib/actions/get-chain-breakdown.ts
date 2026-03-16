import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, MULTICHAIN_DEFILLAMA_SLUG } from '../common';

export const getChainBreakdown = createAction({
  auth: PieceAuth.None(),
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch TVL breakdown by blockchain for Multichain, sorted by TVL descending.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${MULTICHAIN_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    if (!currentChainTvls) {
      return { chains: [], totalTvl: 0 };
    }

    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);

    return {
      chains,
      totalTvl,
      chainCount: chains.length,
      topChain: chains[0] ?? null,
    };
  },
});
