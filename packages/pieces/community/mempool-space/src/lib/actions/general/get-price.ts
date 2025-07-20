import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getPrice = createAction({
    name: 'get_price',
    displayName: 'Get Price',
    description: 'Returns bitcoin latest price in main currencies',
    // category: 'General',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/prices`,
        });
        return response.body;
    },
});