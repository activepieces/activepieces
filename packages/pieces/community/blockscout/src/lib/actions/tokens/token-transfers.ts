import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenTransfers = createAction({
  name: 'get_token_transfers',
  displayName: 'Get Token Transfers',
  description: 'Get list of token transfers',
  audience: 'both',
  aiMetadata: { description: 'List recent transfers of one token, identified by its contract address, across all holders (newest first). Read-only. Use this to track movement of a specific token over time; for the token transfers inside a single transaction use the Transactions Get Transaction Token Transfers action instead.', idempotent: true },
  // category: 'Tokens',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to fetch transfers for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/tokens/${context.propsValue.addressHash}/transfers`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
