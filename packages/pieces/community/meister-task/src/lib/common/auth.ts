

import { PieceAuth, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { meisterTaskApiUrl } from './client';

const scopes = [
    'userinfo.email',
    'userinfo.profile',
    'meistertask'
];

export const meisterTaskAuth = PieceAuth.OAuth2({
    description: `
    To get your credentials:
    1. Log in to your MeisterTask account.
    2. Visit **https://www.mindmeister.com/api** (This is the correct URL).
    3. Click **"Add"** under "OAuth 2.0 Apps".
    4. Set the **Redirect URI** to: \`https://cloud.activepieces.com/redirect\`
    5. Copy the **Client ID** and **Client Secret** into the fields below.
    `,
    authUrl: "https://www.mindmeister.com/oauth2/authorize",
    tokenUrl: "https://www.mindmeister.com/oauth2/token",
    required: true,
    scope: scopes,
    validate: async ({ auth }) => {
        const accessToken = (auth as OAuth2PropertyValue).access_token;
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${meisterTaskApiUrl}/projects`, 
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: accessToken,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid token or insufficient scopes.',
            };
        }
    },
});