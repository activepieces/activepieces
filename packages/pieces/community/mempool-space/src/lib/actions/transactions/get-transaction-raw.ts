import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionRaw = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_raw',
  displayName: 'Get Raw Transaction',
  description: 'Get the raw transaction in hex format',
  audience: 'both',
  aiMetadata: { description: 'Fetch the raw serialized bytes of a transaction by its transaction ID from the /raw endpoint. Functionally equivalent to Get Transaction Hex; pick this for the binary raw form, and use Get Transaction for the parsed/structured detail. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to get raw data for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/raw`,
    });
    return response.body;
  },
});
