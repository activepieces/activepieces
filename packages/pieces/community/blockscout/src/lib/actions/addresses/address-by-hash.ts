import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressByHash = createAction({
  name: 'get_address_by_hash',
  displayName: 'Get Address by Hash',
  description: 'Get address info by its hash',
  audience: 'both',
  aiMetadata: { description: 'Look up the core profile of a single address: current balance, contract/EOA status, name tags, and implementation details. Pick this as the first lookup for one known address before drilling into its transactions, tokens, or logs. Read-only lookup on eth.blockscout.com; requires a 0x address hash.', idempotent: true },
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
