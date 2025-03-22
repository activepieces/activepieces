import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getDifficultyAdjustment = createAction({
    name: 'get_difficulty_adjustment',
    displayName: 'Get Difficulty Adjustment',
    description: 'Returns details about Bitcoin difficulty adjustment',
    // category: 'General',
    props: {},
    async run() {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/difficulty-adjustment`,
        });

        return response.body;
    },
});