import { PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const qwilrAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: `
    1. Go to your Qwilr account settings.
    2. Navigate to API Settings.
    3. Copy your access token.`,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.qwilr.com/v1/users',
                headers: {
                    'Authorization': `Bearer ${auth}`
                }
            })

            return {
                valid: true
            }
        }
        catch {
            return {
                valid: false,
                error: 'Invalid API Key.'
            }
        }
    }
})
