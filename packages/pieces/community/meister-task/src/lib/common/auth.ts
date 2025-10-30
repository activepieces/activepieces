import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { meisterTaskApiUrl } from './client';

export const meisterTaskAuth = PieceAuth.SecretText({
    displayName: 'Personal Access Token',
    description: `
    To get your Personal Access Token:
    1. Log in to your MeisterTask account.
    2. Visit: **https://www.mindmeister.com/api** (This is the correct URL for MeisterTask tokens).
    3. Click **"Add"** under the "Personal Access Token" section.
    4. Give your token a name and select the required scopes (e.g., \`meistertask.readonly\`, \`userinfo.profile\`).
    5. Copy the generated token.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${meisterTaskApiUrl}/projects`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Personal Access Token.',
            };
        }
    },
});
