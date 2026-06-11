import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressTokenBalances = createAction({
  name: 'get_address_token_balances',
  displayName: 'Get Address Token Balances',
  description: 'Get list of token balances for an address',
  audience: 'both',
  aiMetadata: { description: 'Get the full current token holdings of an address as a flat list of balances. Choose this for a snapshot of what tokens an account holds and how much; use Get Address Token Transfers for movement history or Get Address Tokens for the paginated/filterable variant. Read-only lookup on eth.blockscout.com; requires a 0x address hash.', idempotent: true },
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch token balances for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/token-balances`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
