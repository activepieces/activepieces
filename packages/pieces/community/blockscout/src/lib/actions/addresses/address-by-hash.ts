import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressByHash = createAction({
  name: 'get_address_by_hash',
  displayName: 'Get Address by Hash',
  description: 'Get address info by its hash',
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch info for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
