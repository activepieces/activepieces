import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTransactionIds = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_transaction_ids',
    displayName: 'Get Block Transaction IDs',
    description: 'Returns a list of all transaction IDs in the block',
    audience: 'both',
    aiMetadata: { description: 'List the transaction IDs of every transaction in a block, given the block hash. Pick this for the complete set of IDs only; use Get Block Transactions when you need full transaction objects (paginated, 25 at a time). Read-only.', idempotent: true },
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/txids`,
        });
        return response.body;
    },
});