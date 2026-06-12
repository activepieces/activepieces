import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTransactionRawTrace = createAction({
  name: 'get_transaction_raw_trace',
  displayName: 'Get Transaction Raw Trace',
  description: 'Get raw trace data for a transaction',
  audience: 'both',
  aiMetadata: { description: 'Get the low-level raw execution trace (opcode-level call frames) for one Ethereum transaction by hash. Read-only and intended for deep debugging of contract execution. Prefer the higher-level Get Transaction Internal Transactions or Get Transaction by Hash actions for ordinary lookups; reach for this only when you need the full unprocessed trace.', idempotent: true },
  // category: 'Transactions',
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'Hash of the transaction to fetch raw trace for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/transactions/${context.propsValue.transactionHash}/raw-trace`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
