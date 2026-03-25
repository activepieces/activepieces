import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBlockWithdrawals = createAction({
  name: 'get_block_withdrawals',
  displayName: 'Get Block Withdrawals',
  description: 'Get list of withdrawals for a specific block',
  // category: 'Blocks',
  props: {
    blockIdentifier: Property.ShortText({
      displayName: 'Block Hash or Number',
      description: 'Block hash or block number to fetch withdrawals for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/blocks/${context.propsValue.blockIdentifier}/withdrawals`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
