import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionOutspends = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_outspends',
  displayName: 'Get All Transaction Output Spend Statuses',
  description: 'Get the spending status of all outputs in a transaction',
  audience: 'both',
  aiMetadata: { description: 'Check the spent/unspent status of every output of a transaction at once, by its transaction ID. Pick this to survey all outputs; use Get Transaction Output Spend Status to check a single output by index. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to check all output spending statuses',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/outspends`,
    });
    return response.body;
  },
});
