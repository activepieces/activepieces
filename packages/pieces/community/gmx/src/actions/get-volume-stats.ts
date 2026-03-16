import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { GMX_STATS_BASE_URL, DEFILLAMA_BASE_URL, GMX_CHAINS } from '../lib/gmx-api';

export const getVolumeStats = createAction({
  name: 'get_volume_stats',
  displayName: 'Get Volume Stats',
  description: 'Get historical trading volume data for GMX',
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
        url: `${GMX_STATS_BASE_URL}/${chain}/volume`,
      });
      return response.body;
    } catch {
      // Fallback: try the base stats endpoint for any volume info
      try {
        const statsResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${GMX_STATS_BASE_URL}/${chain}`,
        });
        const data = statsResponse.body;
        return {
          source: 'gmx_stats_fallback',
          chain,
          totalVolume: data.totalVolume,
          volumeStats: data.volumeStats,
          dailyVolume: data.dailyVolume,
          raw: data,
        };
      } catch {
        // Final fallback to DeFiLlama
        const llamaResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${DEFILLAMA_BASE_URL}/protocol/gmx`,
        });
        const data = llamaResponse.body;
        return {
          source: 'defillama_fallback',
          name: data.name,
          tvl: data.tvl,
          currentChainTvls: data.currentChainTvls,
          volumeHistory: data.volumeHistory ?? null,
        };
      }
    }
  },
});
