import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressTokenTransfers = createAction({
  name: 'get_address_token_transfers',
  displayName: 'Get Address Token Transfers',
  description: 'Get list of token transfers for an address',
  audience: 'both',
  aiMetadata: { description: 'List the token transfer events (ERC-20/721/1155) in which an address sent or received tokens. Pick this for token movement history; use Get Address Token Balances for current holdings or Get Address Transactions for native-coin transfers. Read-only lookup on eth.blockscout.com; requires a 0x address hash.', idempotent: true },
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch token transfers for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/token-transfers`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
