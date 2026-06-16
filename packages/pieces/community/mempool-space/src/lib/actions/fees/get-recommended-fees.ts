import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getRecommendedFees = createAction({
 auth:PieceAuth.None(),
    name: 'get_recommended_fees',
    displayName: 'Get Recommended Fees',
    description: 'Returns recommended fee rates for different transaction confirmation targets',
    audience: 'both',
    aiMetadata: { description: 'Returns suggested Bitcoin fee rates (in sat/vB) for several confirmation targets such as fastest, half-hour, hour, economy, and minimum. Takes no input and is read-only and idempotent, but values track live mempool conditions and update continuously. Use this to pick a fee for a transaction; use Get Mempool Blocks Fees when you need the full per-block fee breakdown instead.', idempotent: true },
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
