import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const ForeplayAuth = PieceAuth.SecretText({
    displayName: 'Foreplay API Key',
    description: `**Enter your Foreplay API Key**
  
To obtain your API key:
1. Log in to your Foreplay account
2. Navigate to your account settings
3. Look for the API section and generate a new key
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                // Attempt to make a simple API call to validate the API key
                await makeRequest(auth as string, HttpMethod.GET, '/brand', {});
                return {
                    valid: true,
                };
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid API Key',
                };
            }
        }
        return {
            valid: false,
            error: 'API Key is required',
        };
    },
});
