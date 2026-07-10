import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenInstances = createAction({
  name: 'get_token_instances',
  displayName: 'Get Token Instances',
  description: 'Get list of token instances (NFTs)',
  audience: 'both',
  aiMetadata: { description: 'List the individual NFT instances (token IDs) minted under one NFT contract, identified by its address. Read-only and only meaningful for ERC-721/1155 collections. Use this to enumerate items in a collection; for fungible token holders use Get Token Holders and for general token info use Get Token by Address.', idempotent: true },
  // category: 'Tokens',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to fetch instances for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/tokens/${context.propsValue.addressHash}/instances`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
