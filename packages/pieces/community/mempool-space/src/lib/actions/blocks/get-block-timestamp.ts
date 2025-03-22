import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTimestamp = createAction({
    name: 'get_block_timestamp',
    displayName: 'Get Block Timestamp',
    description: 'Returns the height and hash of the block closest to the given timestamp',
    // category: 'Blocks',
    props: {
        timestamp: Property.Number({
            displayName: 'Timestamp',
            description: 'Unix timestamp to find the closest block to',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/mining/blocks/timestamp/${propsValue.timestamp}`,
        });
        return response.body;
    },
});