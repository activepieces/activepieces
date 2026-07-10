import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
export const getTransactionStateChanges = createAction({
  name: 'get_transaction_state_changes',
  displayName: 'Get Transaction State Changes',
  description: 'Get list of state changes in a transaction',
  audience: 'both',
  aiMetadata: { description: 'List the account balance and storage state changes (before/after values) caused by one Ethereum transaction, identified by its hash. Read-only. Use this to see how a transaction altered account or contract state; for the events it emitted use Get Transaction Logs instead.', idempotent: true },

  // category: 'Transactions',
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'Hash of the transaction to fetch state changes for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions/${context.propsValue.transactionHash}/state-changes`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
