import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getTransactionMerkleProof = createAction({
 auth:PieceAuth.None(),
  name: 'get_transaction_merkle_proof',
  displayName: 'Get Transaction Merkle Proof',
  description: 'Get the merkle proof for a transaction',
  audience: 'both',
  aiMetadata: { description: 'Get the Merkle inclusion proof for a confirmed transaction (block height, merkle path, position) to verify it belongs to its block. Pick this for the SPV-style merkle path; use Get Transaction Merkleblock Proof for the encoded merkleblock format. Read-only.', idempotent: true },
  // category: 'Transactions',
  props: {
    txid: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction ID to get merkle proof for',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEMPOOL_API_BASE_URL}/api/tx/${propsValue.txid}/merkle-proof`,
    });
    return response.body;
  },
});
