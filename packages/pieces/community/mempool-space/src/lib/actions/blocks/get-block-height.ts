import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockHeight = createAction({
    name: 'get_block_height',
    displayName: 'Get Block Height',
    description: 'Returns the hash of the block currently at specified height',
    // category: 'Blocks',
    props: {
        height: Property.Number({
            displayName: 'Block Height',
            description: 'The height of the block to look up',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/block-height/${propsValue.height}`,
        });
        return response.body;
    },
});