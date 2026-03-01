import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBlockByHash = createAction({
  name: 'get_block_by_hash',
  displayName: 'Get Block by Hash or Number',
  description: 'Get block info by its hash or block number',
  // category: 'Blocks',
  props: {
    blockIdentifier: Property.ShortText({
      displayName: 'Block Hash or Number',
      description: 'Block hash or block number to fetch',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/blocks/${context.propsValue.blockIdentifier}`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
