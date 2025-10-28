

import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getBigCommerceApiUrl } from './client';

export type BigCommerceAuth = {
    accessToken: string;
    storeHash: string;
}

export const bigcommerceAuth = PieceAuth.CustomAuth({
    description: `
    To get your API credentials:
    1. Log in to your BigCommerce admin panel.
    2. Go to **Settings -> Store-level API accounts**.
    3. Click **"+ Create API Account"** and select **"V2/V3 API token"**.
    4. Name the account and select the required **OAuth scopes**.
    5. Save. A pop-up will display your credentials.
    6. Copy the **Access Token** (your API key) and the **API Path**.
    7. The **Store Hash** is the part of the API Path after \`/stores/\` (e.g., \`abc123def\`).
    `,
    required: true,
    props: {
        accessToken: PieceAuth.SecretText({
            displayName: 'Access Token (X-Auth-Token)',
            description: 'The "Access Token" provided when you created the API account.',
            required: true,
        }),
        storeHash: Property.ShortText({
            displayName: 'Store Hash',
            description: 'The unique hash of your store (from the "API Path").',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        const { accessToken, storeHash } = auth as BigCommerceAuth;
        if (!accessToken || !storeHash) {
            return { valid: false, error: "Access Token and Store Hash are required." };
        }
        try {
            const url = `${getBigCommerceApiUrl(storeHash)}/v3/catalog/products?limit=1`;
            
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: url,
                headers: {
                    'X-Auth-Token': accessToken,
                    'Accept': 'application/json'
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Access Token or Store Hash. Please check your credentials.',
            };
        }
    },
});