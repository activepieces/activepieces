import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE } from '../lib/drift-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Drift Protocol Total Value Locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE}/protocol/drift-protocol`,
    });
    return response.body;
  },
});
