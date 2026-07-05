import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getDifficultyAdjustment = createAction({
 auth:PieceAuth.None(),
    name: 'get_difficulty_adjustment',
    displayName: 'Get Difficulty Adjustment',
    description: 'Returns details about Bitcoin difficulty adjustment',
    audience: 'both',
    aiMetadata: { description: 'Read the current Bitcoin mining difficulty-adjustment status: progress through the current 2016-block epoch, estimated next-retarget difficulty change, and time/blocks remaining. Pick this for network-wide difficulty/retarget questions, not for a specific block or transaction. Read-only and takes no input.', idempotent: true },
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