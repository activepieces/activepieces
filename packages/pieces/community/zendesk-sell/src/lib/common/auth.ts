import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export type ZendeskSellAuth = {
    email: string;
    api_token: string;
}

const ZENDESK_SELL_API_URL = 'https://api.getbase.com';

export const zendeskSellAuth = PieceAuth.CustomAuth({
    description: `
    To get your API token:
    1. Log in to your Zendesk Sell account.
    2. Go to **Settings > Integrations > APIs**.
    3. If no token is active, click **Add API Token**.
    4. Copy the **API Token**.
    
    You also need your login email.
    `,
    required: true,
    props: {
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'Your Zendesk login email address.',
            required: true,
        }),
        api_token: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'Your Zendesk Sell API Token.',
            required: true,
        })
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${ZENDESK_SELL_API_URL}/v2/users/self`, 
                authentication: {
                    type: AuthenticationType.BASIC,
                    username: `${auth.email}/token`,
                    password: auth.api_token,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API token or email.',
            };
        }
    },
});