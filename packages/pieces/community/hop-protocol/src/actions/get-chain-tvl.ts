import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HOP_API_URLS } from '../lib/hop-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get Chain TVL',
  description: 'Get the current total value locked (TVL) for Hop Protocol as a single number',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: HOP_API_URLS.CHAIN_TVL,
    });
    return { tvl: response.body };
  },
});
