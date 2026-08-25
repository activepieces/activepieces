import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionStatus = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_status',
  displayName: 'Get Transaction Status',
  description: 'Get the confirmation status of a transaction',
  audience: 'both',
  aiMetadata: { description: 'Check whether a transaction is confirmed and, if so, in which block (height, hash, time) by its transaction ID. Pick this for a quick confirmed/unconfirmed answer; use Get Transaction for the full transaction detail. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to check status for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/status`,
    });
    return response.body;
  },
});
