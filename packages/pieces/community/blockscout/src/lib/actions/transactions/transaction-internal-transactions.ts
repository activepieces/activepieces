import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionInternalTransactions = createAction({
  name: 'get_transaction_internal_transactions',
  displayName: 'Get Transaction Internal Transactions',
  description: 'Get list of internal transactions in a transaction',
  audience: 'both',
  aiMetadata: { description: 'List the internal transactions (value-transferring calls made by contracts, not separate top-level transactions) triggered within one Ethereum transaction, identified by its hash. Read-only. Use this to trace contract-to-contract ETH movement inside a single transaction; for ERC token movements in that transaction use Get Transaction Token Transfers instead.', idempotent: true },
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
