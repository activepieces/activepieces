import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddresses = createAction({
  name: 'get_addresses',
  displayName: 'Get Addresses',
  description: 'Get list of native coin holders',
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
