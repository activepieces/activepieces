import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlock = createAction({
 auth:PieceAuth.None(),
    name: 'get_block',
    displayName: 'Get Block',
    description: 'Returns detailed block information',
    audience: 'both',
    aiMetadata: { description: 'Look up full metadata for one Bitcoin block by its block hash (height, timestamp, transaction count, size, weight, merkle root, etc.). Read-only and idempotent. Requires the exact 64-character block hash; if you only have a height, resolve the hash first. Use Get Block Status for confirmation depth, Get Block Header for the raw hex header, or Get Block Raw for the binary serialization.', idempotent: true },
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
            url: `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}`,
        });
        return response.body;
    },
});