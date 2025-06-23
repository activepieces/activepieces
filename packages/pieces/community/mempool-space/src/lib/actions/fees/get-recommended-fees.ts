import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getRecommendedFees = createAction({
    name: 'get_recommended_fees',
    displayName: 'Get Recommended Fees',
    description: 'Returns recommended fee rates for different transaction confirmation targets',
    // category: 'Fees',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/fees/recommended`,
        });
        return response.body;
    },
});
