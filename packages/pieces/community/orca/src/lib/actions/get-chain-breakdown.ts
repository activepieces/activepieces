import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'getChainBreakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get the TVL breakdown for Orca by blockchain chain from DeFiLlama.',
  props: {},
  auth: undefined,
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/orca',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<
      string,
      number
    >;
    const chains = data['chains'] as string[];

    const breakdown = Object.entries(currentChainTvls).map(
      ([chain, tvl]: [string, number]) => ({
        chain,
        tvlUSD: tvl,
      })
    );

    breakdown.sort((a, b) => b.tvlUSD - a.tvlUSD);

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvlUSD, 0);

    return {
      chains,
      chainBreakdown: breakdown,
      totalTvlUSD: totalTvl,
    };
  },
});
