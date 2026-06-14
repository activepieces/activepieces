import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTransactions = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_transactions',
    displayName: 'Get Block Transactions',
    description: 'Returns a list of transactions in the block (up to 25 transactions)',
    audience: 'both',
    aiMetadata: { description: 'List full transaction objects within a block by block hash, returning up to 25 per call with an optional start index for pagination. Pick this for transaction detail; use Get Block Transaction IDs when you only need the IDs. Read-only.', idempotent: true },
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block',
            required: true
        }),
        startIndex: Property.Number({
            displayName: 'Start Index',
            description: 'Optional: Starting index for pagination',
            required: false
        })
    },
    async run({ propsValue }) {
        let url = `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/txs`;
        if (propsValue.startIndex !== undefined) {
            url += `/${propsValue.startIndex}`;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
        });
        return response.body;
    },
});