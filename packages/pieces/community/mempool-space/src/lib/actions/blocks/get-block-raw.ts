import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockRaw = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_raw',
    displayName: 'Get Block Raw',
    description: 'Returns the raw block representation in binary',
    audience: 'both',
    aiMetadata: { description: 'Fetches the full raw serialized block (binary representation) for a given block hash. Read-only and idempotent. Choose this only when you need the complete on-the-wire block bytes; for human-readable fields use Get Block, and for just the 80-byte header use Get Block Header.', idempotent: true },
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block to look up',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/raw`,
        });
        return response.body;
    },
});