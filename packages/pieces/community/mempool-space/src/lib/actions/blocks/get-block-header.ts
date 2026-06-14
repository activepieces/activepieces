import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockHeader = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_header',
    displayName: 'Get Block Header',
    description: 'Returns the hex-encoded block header',
    audience: 'both',
    aiMetadata: { description: 'Returns the hex-encoded 80-byte block header for a given block hash (version, previous hash, merkle root, timestamp, bits, nonce). Read-only and idempotent. Pick this when you only need the header rather than the full block; use Get Block for parsed fields or Get Block Raw for the entire serialized block.', idempotent: true },
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
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/header`,
        });
        return response.body;
    },
});