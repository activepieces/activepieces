import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTipHash = createAction({
    name: 'get_block_tip_hash',
    displayName: 'Get Block Tip Hash',
    description: 'Returns the hash of the last block',
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