import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactions = createAction({
  name: 'get_transactions',
  displayName: 'Get Transactions',
  description: 'Get list of transactions',
  audience: 'both',
  aiMetadata: { description: 'List recent Ethereum transactions across the whole chain (validated mainnet transactions, newest first). Read-only and takes no inputs. Use this for chain-wide browsing; to fetch one known transaction use Get Transaction by Hash, and to scope to a single block use Get Block Transactions.', idempotent: true },
  // category: 'Transactions',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
