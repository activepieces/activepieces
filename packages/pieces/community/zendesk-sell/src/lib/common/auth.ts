import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from '@activepieces/pieces-common';


export interface ZendeskSellAuth {
    subdomain: string;
    email: string;
    api_token: string;
}

export const zendeskSellAuth = PieceAuth.CustomAuth({
    description: `
    To get your API token, go to your Zendesk Sell account and navigate to:
    **Settings > Integrations > API > Zendesk API** and enable Token Access.
    `,
    props: {
        subdomain: Property.ShortText({
            displayName: 'Subdomain',
            description: 'Your Zendesk subdomain (e.g., yourcompany from yourcompany.zendesk.com)',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address you use to log in to Zendesk.',
            required: true,
        }),
        api_token: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'Your Zendesk API token.',
            required: true,
        }),
    },
    required: true,
    validate: async ({ auth }: { auth: ZendeskSellAuth }) => {
        try {
            const { subdomain, email, api_token } = auth;
            
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `https://${subdomain}.zendesk.com/api/v2/users/me.json`,
                authentication: {
                    type: AuthenticationType.BASIC,
                    username: `${email}/token`,
                    password: api_token,
                },
            };
            
            await httpClient.sendRequest(request);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: 'Connection failed. Please check your subdomain, email, and API token.',
            };
        }
    },
});