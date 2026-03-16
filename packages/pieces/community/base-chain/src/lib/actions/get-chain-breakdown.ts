import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Retrieve the TVL breakdown by chain for the Base protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/base',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const breakdown: Record<string, unknown> = {};
    if (chainTvls) {
      for (const [chain, tvlData] of Object.entries(chainTvls)) {
        const tvlArray = (tvlData as Record<string, unknown>)['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
        const latest = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
        breakdown[chain] = {
          currentTvl: currentChainTvls?.[chain] ?? null,
          latestEntry: latest ?? null,
        };
      }
    }

    return {
      protocol: data['name'],
      currentChainTvls: currentChainTvls ?? {},
      chainBreakdown: breakdown,
    };
  },
});
