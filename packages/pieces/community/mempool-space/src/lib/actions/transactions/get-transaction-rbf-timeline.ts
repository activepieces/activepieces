import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionRbfTimeline = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_rbf_timeline',
  displayName: 'Get Transaction RBF Timeline',
  description: 'Get the Replace-By-Fee (RBF) timeline for a transaction',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the Replace-By-Fee (RBF) history for a transaction ID, showing the chain of fee-bumping replacements over time. Pick this when investigating whether/how a transaction was replaced or fee-bumped. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to get RBF timeline for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/rbf-timeline`,
    });
    return response.body;
  },
});
