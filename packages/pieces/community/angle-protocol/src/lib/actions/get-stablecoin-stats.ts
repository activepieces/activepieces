import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_ANGLE_URL } from '../angle-api';

export const getStablecoinStats = createAction({
  name: 'get-stablecoin-stats',
  displayName: 'Get Stablecoin Stats',
  description: 'Get Angle Protocol stablecoin stats including current chain TVLs, methodology, and description',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_ANGLE_URL,
    });
    const data = response.body;
    return {
      currentChainTvls: data.currentChainTvls ?? {},
      methodology: data.methodology ?? null,
      description: data.description ?? null,
    };
  },
});
