import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getMempoolBlocksFees = createAction({
 auth:PieceAuth.None(),
    name: 'get_mempool_blocks_fees',
    displayName: 'Get Mempool Blocks Fees',
    description: 'Returns current mempool as projected blocks with fee rates and sizes',
    audience: 'both',
    aiMetadata: { description: 'Returns the current mempool modeled as a series of projected upcoming blocks, each with its fee-rate range, median fee, size, and transaction count. Takes no input and is read-only and idempotent, but reflects a live snapshot that shifts every few seconds. Use this for detailed fee-tier/congestion analysis; use Get Recommended Fees for simple confirmation-target fee picks.', idempotent: true },
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
