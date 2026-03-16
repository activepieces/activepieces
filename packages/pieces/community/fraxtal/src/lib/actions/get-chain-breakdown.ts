import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown by chain for the Fraxtal protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/fraxtal',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    if (!chainTvls) {
      return { chains: [] };
    }

    const chains = Object.entries(chainTvls).map(([chain, tvlData]) => {
      const tvlObj = tvlData as Record<string, unknown>;
      const tvlArr = tvlObj['tvl'] as Array<Record<string, number>> | undefined;
      const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;

      return {
        chain,
        tvl_usd: latestTvl ? latestTvl['totalLiquidityUSD'] : null,
      };
    });

    return {
      protocol: data['name'],
      chains,
      total_chains: chains.length,
    };
  },
});
