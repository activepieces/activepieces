import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, BEEFY_DEFILLAMA_SLUG } from '../common';

export const getChainBreakdown = createAction({
  auth: PieceAuth.None(),
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch the TVL breakdown by blockchain for Beefy Finance, showing how assets are distributed across all supported chains.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${BEEFY_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    if (!currentChainTvls) {
      return { chains: [], totalChains: 0, totalTvl: 0 };
    }

    const chainEntries = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);

    const totalTvl = chainEntries.reduce((sum, c) => sum + c.tvlUsd, 0);

    return {
      chains: chainEntries.map((c) => ({
        ...c,
        sharePercent:
          totalTvl > 0 ? Number(((c.tvlUsd / totalTvl) * 100).toFixed(2)) : 0,
      })),
      totalChains: chains ? chains.length : chainEntries.length,
      totalTvlUsd: totalTvl,
    };
  },
});
