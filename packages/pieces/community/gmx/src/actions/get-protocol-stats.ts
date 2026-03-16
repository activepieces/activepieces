import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { GMX_STATS_BASE_URL, DEFILLAMA_BASE_URL, GMX_CHAINS } from '../lib/gmx-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get GMX protocol stats including fees, volume, and user metrics',
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
      return response.body;
    } catch {
      // Fallback to DeFiLlama
      const llamaResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${DEFILLAMA_BASE_URL}/protocol/gmx`,
      });
      const data = llamaResponse.body;
      return {
        source: 'defillama_fallback',
        name: data.name,
        symbol: data.symbol,
        tvl: data.tvl,
        currentChainTvls: data.currentChainTvls,
        chainTvls: data.chainTvls,
        description: data.description,
      };
    }
  },
});
