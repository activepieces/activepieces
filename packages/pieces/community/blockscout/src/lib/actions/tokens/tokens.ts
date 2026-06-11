import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokens = createAction({
  name: 'get_tokens',
  displayName: 'Get Tokens',
  description: 'Get list of tokens',
  audience: 'both',
  aiMetadata: { description: 'List tokens tracked on the chain (ERC-20/721/1155), takes no inputs. Read-only. Use this to browse or discover tokens when you do not have a specific contract address; once you have an address use Get Token by Address for its details.', idempotent: true },

  // category: 'Tokens',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/tokens`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
