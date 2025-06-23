import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const postTransaction = createAction({
  name: 'post_transaction',
  displayName: 'Post Transaction',
  description: 'Submit a raw transaction to the network',
  // category: 'Transactions',
  props: {
    rawTx: Property.LongText({
      displayName: 'Raw Transaction',
      description: 'The raw transaction in hex format to broadcast',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${MEMPOOL_API_BASE_URL}/api/tx`,
      body: propsValue.rawTx,
    });
    return response.body;
  },
});
