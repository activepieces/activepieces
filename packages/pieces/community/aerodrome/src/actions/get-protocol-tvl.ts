import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AERODROME_API } from '../lib/aerodrome-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Aerodrome Finance total value locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: AERODROME_API.DEFILLAMA_PROTOCOL,
    });
    return response.body;
  },
});
