import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBlockWithdrawals = createAction({
  name: 'get_block_withdrawals',
  displayName: 'Get Block Withdrawals',
  description: 'Get list of withdrawals for a specific block',
  audience: 'both',
  aiMetadata: { description: 'List the validator (beacon-chain) staking withdrawals included in one Ethereum block, identified by its hash or number. Read-only. Use this for post-Merge withdrawal data of a specific block; for the regular transactions in that block use Get Block Transactions instead.', idempotent: true },
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
