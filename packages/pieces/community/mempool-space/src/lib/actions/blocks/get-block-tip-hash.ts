import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTipHash = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_tip_hash',
    displayName: 'Get Block Tip Hash',
    description: 'Returns the hash of the last block',
    audience: 'both',
    aiMetadata: { description: 'Get the hash of the current chain-tip (latest) block. Pick this as the starting point for "most recent block" queries, then feed the hash into other block actions. Read-only and takes no input; the result changes as new blocks are mined.', idempotent: true },
    // category: 'Blocks',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/blocks/tip/hash`,
        });
        return response.body;
    },
});