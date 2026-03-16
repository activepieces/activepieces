import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_CLEARPOOL_URL } from '../clearpool-api';

export const getCreditStats = createAction({
  name: 'get-credit-stats',
  displayName: 'Get Credit Stats',
  description: 'Get Clearpool credit market statistics including current chain TVLs, methodology, and description',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_CLEARPOOL_URL,
    });
    const data = response.body;
    return {
      currentChainTvls: data.currentChainTvls ?? {},
      methodology: data.methodology ?? null,
      description: data.description ?? null,
    };
  },
});
