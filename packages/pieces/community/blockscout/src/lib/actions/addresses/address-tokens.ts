import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressTokens = createAction({
  name: 'get_address_tokens',
  displayName: 'Get Address Tokens',
  description: 'Get list of tokens owned by an address with filtering options',
  audience: 'both',
  aiMetadata: { description: 'List the tokens owned by an address, the paginated/filterable view of its holdings (e.g. by token type). Choose this when iterating through many holdings; use Get Address Token Balances for a simple full snapshot. Read-only lookup on eth.blockscout.com; requires a 0x address hash.', idempotent: true },
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch tokens for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/tokens`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
