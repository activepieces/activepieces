import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTipHeight = createAction({
 auth:PieceAuth.None(),
    name: 'get_block_tip_height',
    displayName: 'Get Block Tip Height',
    description: 'Returns the height of the last block',
    audience: 'both',
    aiMetadata: { description: 'Returns the current Bitcoin chain tip height (the height of the most recently mined block) as a single number. Takes no input and is read-only and idempotent, though the value advances roughly every ten minutes as new blocks arrive. Use this to learn the latest height or to compute confirmation counts.', idempotent: true },
    // category: 'Blocks',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/blocks/tip/height`,
        });
        return response.body;
    },
});