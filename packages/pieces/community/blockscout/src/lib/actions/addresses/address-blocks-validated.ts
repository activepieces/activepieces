import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressBlocksValidated = createAction({
  name: 'get_address_blocks_validated',
  displayName: 'Get Address Blocks Validated',
  description: 'Get list of blocks validated by an address',
  audience: 'both',
  aiMetadata: { description: 'List the blocks an address validated or produced (relevant for validator/miner addresses). Choose this to inspect an account’s block-production history rather than its transactions or balances. Read-only lookup on eth.blockscout.com; requires a 0x address hash and returns empty for non-validator addresses.', idempotent: true },
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch validated blocks for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/blocks-validated`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
