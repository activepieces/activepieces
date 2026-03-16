import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BANCOR_URL } from '../bancor-api';

export const getPoolStats = createAction({
  name: 'get-pool-stats',
  displayName: 'Get Pool Stats',
  description: 'Get Bancor pool stats including current chain TVLs, methodology, and audits',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_BANCOR_URL,
    });
    const data = response.body;
    return {
      currentChainTvls: data.currentChainTvls ?? {},
      methodology: data.methodology ?? null,
      audits: data.audits ?? null,
    };
  },
});
