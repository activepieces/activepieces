import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddresses = createAction({
  name: 'get_addresses',
  displayName: 'Get Addresses',
  description: 'Get list of native coin holders',
  audience: 'both',
  aiMetadata: { description: 'List the top native-coin (ETH) holding addresses on the chain, ordered by balance. Pick this to discover or rank wealthy accounts; it takes no input and does not target a specific address (use Get Address by Hash for a single account). Read-only lookup on eth.blockscout.com.', idempotent: true },
  // category: 'Addresses',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
