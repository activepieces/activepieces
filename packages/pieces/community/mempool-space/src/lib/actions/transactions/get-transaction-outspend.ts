import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionOutspend = createAction({
  name: 'get_transaction_outspend',
  displayName: 'Get Transaction Output Spend Status',
  description: 'Get the spending status of a specific transaction output',
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to check output spending status',
      required: true,
    }),
    vout: Property.Number({
      displayName: 'Output Index',
      description: 'The index of the output to check (0-based)',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/outspend/${propsValue.vout}`,
    });
    return response.body;
  },
});
