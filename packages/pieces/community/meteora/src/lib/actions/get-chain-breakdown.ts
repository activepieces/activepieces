import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    "Fetch Meteora's TVL breakdown by blockchain chain from DeFiLlama.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/meteora',
    });

    const data = response.body as any;
    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const chainTvls: Record<string, unknown> = data.chainTvls ?? {};

    // Build sorted breakdown array
    const breakdown = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUSD: tvl }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvlUSD, 0);

    return {
      totalTvlUSD: totalTvl,
      chainCount: breakdown.length,
      chains: breakdown,
      availableChainData: Object.keys(chainTvls),
    };
  },
});
