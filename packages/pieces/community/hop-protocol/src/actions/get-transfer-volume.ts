import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HOP_API_URLS } from '../lib/hop-api';

export const getTransferVolume = createAction({
  name: 'get_transfer_volume',
  displayName: 'Get Transfer Volume',
  description: 'Get Hop Protocol historical bridge transfer volume and cross-chain stats from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: HOP_API_URLS.BRIDGE_VOLUME,
    });
    return response.body;
  },
});
