import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const bigcommerceAuth = PieceAuth.CustomAuth({
    description: 'Enter your BigCommerce API credentials',
    props: {
        storeHash: Property.ShortText({
            displayName: 'Store Hash',
            description: 'Your BigCommerce store hash (e.g., abc123def)',
            required: true,
        }),
        accessToken: Property.ShortText({
            displayName: 'Access Token',
            description: 'Your BigCommerce API access token',
            required: true,
        }),
    },
    required: true,
});


export async function makeRequest(auth: any, endpoint: string, method: HttpMethod, body?: any) {
    const baseUrl = `https://api.bigcommerce.com/stores/${auth.storeHash}`;

    return await httpClient.sendRequest({
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
            'X-Auth-Token': auth.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body,
    });
}