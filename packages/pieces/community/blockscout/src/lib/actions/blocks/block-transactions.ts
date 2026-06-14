import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBlockTransactions = createAction({
  name: 'get_block_transactions',
  displayName: 'Get Block Transactions',
  description: 'Get list of transactions for a specific block',
  audience: 'both',
  aiMetadata: { description: 'List the transactions contained in one Ethereum block, identified by its hash or number. Read-only. Use this to scope transactions to a single block; for chain-wide recent transactions use the Transactions Get Transactions action, and for that block\'s staking withdrawals use Get Block Withdrawals.', idempotent: true },
  // category: 'Blocks',
  props: {
    blockIdentifier: Property.ShortText({
      displayName: 'Block Hash or Number',
      description: 'Block hash or block number to fetch transactions for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/blocks/${context.propsValue.blockIdentifier}/transactions`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
