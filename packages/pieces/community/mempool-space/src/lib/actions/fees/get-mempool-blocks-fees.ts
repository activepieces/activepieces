import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getMempoolBlocksFees = createAction({
    name: 'get_mempool_blocks_fees',
    displayName: 'Get Mempool Blocks Fees',
    description: 'Returns current mempool as projected blocks with fee rates and sizes',
    // category: 'Fees',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/fees/mempool-blocks`,
        });
        return response.body;
    },
});
