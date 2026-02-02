

import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { uscreenPublisherApiUrl } from './client';

export const uscreenAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `
    To get your API key:
    1. Log in to your Uscreen account
    2. Contact your Customer Success Manager to have an API key (X-Store-Token) issued.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${uscreenPublisherApiUrl}/offers`,
                headers: {
                    'X-Store-Token': auth,
                    'Accept': 'application/json'
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API key or insufficient permissions.',
            };
        }
    },
});