import { PieceAuth } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
  } from '@activepieces/pieces-common';

export const facebookAuth = PieceAuth.SecretText({
    displayName: 'Page Access Token',
    description: 'Authenticate with Facebook Messenger using a Page Access Token',
    required: true,
    validate: async ({ auth }) => {
        try {
            if (!auth || auth.trim() === '') {
                return {
                    valid: false,
                    error: 'Page Access Token is required',
                };
            }
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `https://graph.facebook.com/v18.0/me`,
                queryParams: {
                  access_token: auth,
                  fields: 'id,name'
                },
            };
            const response = await httpClient.sendRequest(request);
            if (response.status >= 200 && response.status < 300 && response.body?.id) {
                return {
                    valid: true,
                };
            }


            const errorMessage = response.body?.error?.message || 'Invalid Page Access Token';
            return {
                valid: false,
                error: errorMessage,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                valid: false,
                error: `Error validating token: ${errorMessage}`,
            };
        }
    },
});
