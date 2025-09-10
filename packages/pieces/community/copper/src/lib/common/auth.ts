import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const copperAuth = PieceAuth.CustomAuth({
    description: `
    To get your API Key:
    1. Log in to your Copper account.
    2. Go to **Settings** -> **Integrations** -> **API Keys**.
    3. Click **GENERATE API KEY**.
    `,
    required: true,
    props: {
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the user who generated the API key.',
            required: true,
        }),
        token: Property.ShortText({ 
            displayName: 'API Token',
            description: 'Your Copper API token.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.copper.com/developer_api/v1/account',
                headers: {
                    'X-PW-AccessToken': auth.token,
                    'X-PW-UserEmail': auth.email,
                    'X-PW-Application': 'developer_api',
                    'Content-Type': 'application/json',
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid credentials. Please check your email and API token.',
            };
        }
    }
});