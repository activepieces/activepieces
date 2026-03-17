import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for the Umee protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/umee',
    });
    const data = response.body as Record<string, any>;
    const chainTvls: Record<string, number> = {};
    const chainTvlsData = data['chainTvls'] as Record<string, any> | undefined;
    if (chainTvlsData) {
      for (const [chain, chainData] of Object.entries(chainTvlsData)) {
        const tvlArray = (chainData as Record<string, any>)['tvl'] as Array<{
          date: number;
          totalLiquidityUSD: number;
        }>;
        if (Array.isArray(tvlArray) && tvlArray.length > 0) {
          const lastEntry = tvlArray[tvlArray.length - 1];
          chainTvls[chain] = lastEntry['totalLiquidityUSD'];
        }
      }
    }
    return {
      protocol: data['name'],
      chains: data['chains'],
      chain_tvl_breakdown: chainTvls,
    };
  },
});
