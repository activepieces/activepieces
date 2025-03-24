import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlocksBulk = createAction({
    name: 'get_blocks_bulk',
    displayName: 'Get Blocks (Bulk)',
    description: 'Returns details on the range of blocks between minHeight and maxHeight, inclusive, up to 10 blocks',
    // category: 'Blocks',
    props: {
        minHeight: Property.Number({
            displayName: 'Minimum Height',
            description: 'The starting block height',
            required: true
        }),
        maxHeight: Property.Number({
            displayName: 'Maximum Height',
            description: 'Optional: The ending block height. If not specified, defaults to the current tip',
            required: false
        })
    },
    async run({ propsValue }) {
        const url = propsValue.maxHeight !== undefined ?
            `${MEMPOOL_API_BASE_URL}/api/v1/blocks-bulk/${propsValue.minHeight}/${propsValue.maxHeight}` :
            `${MEMPOOL_API_BASE_URL}/api/v1/blocks-bulk/${propsValue.minHeight}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
        });
        return response.body;
    },
});