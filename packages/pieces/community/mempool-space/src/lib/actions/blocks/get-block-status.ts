import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockStatus = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_status',
    displayName: 'Get Block Status',
    description: 'Returns the confirmation status of a block',
    audience: 'both',
    aiMetadata: { description: 'Checks whether a block (by hash) is currently in the best chain and reports its confirmation state. Read-only and idempotent, but the result can change if the block is reorganized out of the chain. Use this to verify a block is still confirmed; use Get Block for full block details.', idempotent: true },
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block to check status',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/status`,
        });
        return response.body;
    },
});