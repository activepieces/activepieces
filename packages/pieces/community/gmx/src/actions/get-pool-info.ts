import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { GMX_STATS_BASE_URL, DEFILLAMA_BASE_URL, GMX_CHAINS } from '../lib/gmx-api';

export const getPoolInfo = createAction({
  name: 'get_pool_info',
  displayName: 'Get Pool Info',
  description: 'Get GLP/GM pool composition and APR data for GMX',
  auth: undefined,
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query',
      required: false,
      defaultValue: 'arbitrum',
      options: {
        options: GMX_CHAINS,
      },
    }),
  },
  async run(context) {
    const chain = context.propsValue.chain ?? 'arbitrum';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${GMX_STATS_BASE_URL}/${chain}`,
      });

      const data = response.body;

      // Extract pool-relevant fields if available
      return {
        chain,
        glpSupply: data.glpSupply,
        glpPrice: data.glpPrice,
        aumInUsdg: data.aumInUsdg,
        glpApr: data.glpApr,
        gmxApr: data.gmxApr,
        feesDistributedToGlp: data.feesDistributedToGlp,
        feesDistributedToGmx: data.feesDistributedToGmx,
        poolAmounts: data.poolAmounts,
        raw: data,
      };
    } catch {
      // Fallback to DeFiLlama for pool/TVL context
      const llamaResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${DEFILLAMA_BASE_URL}/protocol/gmx`,
      });
      const data = llamaResponse.body;
      return {
        source: 'defillama_fallback',
        chain,
        name: data.name,
        tvl: data.tvl,
        currentChainTvls: data.currentChainTvls,
        tokens: data.tokens,
        tokensInUsd: data.tokensInUsd,
      };
    }
  },
});
