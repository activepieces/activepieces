import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Hedera protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hedera',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, Record<string, unknown>> | undefined;

    if (!chainTvls) {
      return { chains: [] };
    }

    const chains = Object.entries(chainTvls)
      .map(([chain, info]) => {
        const tvlArr = info['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
        const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : 0;
        return { chain, tvl_usd: latestTvl };
      })
      .filter((c) => !c.chain.includes('-'))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data['name'],
      total_chains: chains.length,
      chains,
    };
  },
});
