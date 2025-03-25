import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTipHeight = createAction({
    name: 'get_block_tip_height',
    displayName: 'Get Block Tip Height',
    description: 'Returns the height of the last block',
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