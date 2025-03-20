import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionInternalTransactions = createAction({
  name: 'get_transaction_internal_transactions',
  displayName: 'Get Transaction Internal Transactions',
  description: 'Get list of internal transactions in a transaction',
  // category: 'Transactions',
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'Hash of the transaction to fetch internal transactions for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions/${context.propsValue.transactionHash}/internal-transactions`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
