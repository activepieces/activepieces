import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTransactionId = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_transaction_id',
    displayName: 'Get Block Transaction ID',
    description: 'Returns the transaction at specified index within the block',
    audience: 'both',
    aiMetadata: { description: 'Resolves the transaction ID (txid) at a specific positional index within a block, given the block hash and a zero-based index (index 0 is the coinbase transaction). Read-only and idempotent. Use this to map a block position to its txid; the index must be within the block transaction count or the lookup fails.', idempotent: true },
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block',
            required: true
        }),
        index: Property.Number({
            displayName: 'Transaction Index',
            description: 'The index of the transaction within the block',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/txid/${propsValue.index}`,
        });
        return response.body;
    },
});