import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionByHash = createAction({
  name: 'get_transaction_by_hash',
  displayName: 'Get Transaction by Hash',
  description: 'Get transaction details by its hash',
  audience: 'both',
  aiMetadata: { description: 'Look up a single Ethereum transaction by its full hash and return its core details (status, value, gas, from/to, block). Read-only. Use this when you have a specific transaction hash; for the related transfers, logs, internal calls, or state changes of that same transaction use the dedicated per-transaction actions instead.', idempotent: true },
  // category: 'Transactions',
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'Hash of the transaction to fetch details for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions/${context.propsValue.transactionHash}`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
