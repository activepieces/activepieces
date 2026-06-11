import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionSummary = createAction({
  name: 'get_transaction_summary',
  displayName: 'Get Transaction Summary',
  description: 'Get a human-readable summary of a transaction',
  audience: 'both',
  aiMetadata: { description: "Get Blockscout's interpreted, human-readable summary of one Ethereum transaction by hash (e.g. a plain-language description of what the transaction did, such as a swap or transfer). Read-only. Use this for a quick natural-language explanation; for the structured raw fields use Get Transaction by Hash instead.", idempotent: true },
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
