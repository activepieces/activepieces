import { PieceAuth } from '@activepieces/pieces-framework'
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common'

export const emailitAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        `Get your API key from your [Emailit Workspace Settings](https://app.emailit.com/settings/api-keys).`,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.emailit.com/v2/domains',
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            })
            return { valid: true }
        } catch {
            return {
                valid: false,
                error: 'Invalid API key. Please check your Emailit Workspace Settings.',
            }
        }
    },
})
