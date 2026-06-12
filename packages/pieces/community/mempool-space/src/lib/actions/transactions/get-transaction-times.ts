import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionTimes = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_times',
  displayName: 'Get Transaction Times',
  description: 'Get timing information for a transaction including first seen and block entry times',
  audience: 'both',
  aiMetadata: { description: 'Get timing information for a transaction by its ID, such as when it was first seen in the mempool. Pick this for propagation/first-seen timing rather than confirmation state (use Get Transaction Status) or full detail (use Get Transaction). Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to get timing information for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/times`,
    });
    return response.body;
  },
});
