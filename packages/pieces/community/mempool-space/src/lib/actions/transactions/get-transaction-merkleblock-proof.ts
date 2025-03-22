import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionMerkleblockProof = createAction({
  name: 'get_transaction_merkleblock_proof',
  displayName: 'Get Transaction Merkleblock Proof',
  description: 'Get the merkle block proof for a transaction',
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to get merkle block proof for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/merkleblock-proof`,
    });
    return response.body;
  },
});
