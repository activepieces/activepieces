import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL distribution across chains for Mango Markets (primarily Solana) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mango-markets',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
      percentage: totalTvl > 0 ? ((tvl / totalTvl) * 100).toFixed(2) + '%' : '0%',
    }));

    const sorted = [...breakdown].sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      totalTvlUsd: totalTvl,
      chains: sorted,
      primaryChain: sorted[0]?.chain ?? 'Solana',
    };
  },
});
