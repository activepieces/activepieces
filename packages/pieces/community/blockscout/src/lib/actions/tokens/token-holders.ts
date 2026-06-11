import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenHolders = createAction({
  name: 'get_token_holders',
  displayName: 'Get Token Holders',
  description: 'Get list of token holders',
  audience: 'both',
  aiMetadata: { description: 'List the addresses holding one token, identified by its contract address, with their balances (largest holders first). Read-only. Use this to see who owns a token; for just the total holder count use Get Token Counters, and for NFT item IDs use Get Token Instances.', idempotent: true },
  // category: 'Tokens',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to fetch holders for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/tokens/${context.propsValue.addressHash}/holders`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
