import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransaction = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description: 'Retrieve transaction details by transaction ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieve full parsed details of a Bitcoin transaction by its transaction ID: inputs, outputs, fee, size, and confirmation status. Pick this as the general-purpose transaction lookup; use narrower actions (status, times, hex, outspends) when you only need one facet. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to retrieve',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}`,
    });
    return response.body;
  },
});
