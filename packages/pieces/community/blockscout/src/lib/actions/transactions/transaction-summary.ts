import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionSummary = createAction({
  name: 'get_transaction_summary',
  displayName: 'Get Transaction Summary',
  description: 'Get a human-readable summary of a transaction',
  // category: 'Transactions',
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'Hash of the transaction to fetch summary for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions/${context.propsValue.transactionHash}/summary`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
