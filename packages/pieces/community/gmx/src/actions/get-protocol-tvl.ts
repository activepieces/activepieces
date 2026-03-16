import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BASE_URL } from '../lib/gmx-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get GMX total value locked across all chains via DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}/protocol/gmx`,
    });

    const data = response.body;

    return {
      name: data.name,
      tvl: data.tvl,
      chainTvls: data.chainTvls,
      currentChainTvls: data.currentChainTvls,
      symbol: data.symbol,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      category: data.category,
      chains: data.chains,
    };
  },
});
