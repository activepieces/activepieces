import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getPrice = createAction({
 auth:PieceAuth.None(),
    name: 'get_price',
    displayName: 'Get Price',
    description: 'Returns bitcoin latest price in main currencies',
    audience: 'both',
    aiMetadata: { description: 'Read the latest spot Bitcoin price across major fiat currencies (USD, EUR, GBP, etc.). Pick this for the current/most-recent price; use Get Historical Price instead when you need the price at a specific past date. Read-only and takes no input.', idempotent: true },

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