import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { PieceAuth } from '@activepieces/pieces-framework'

export const krispcallAuth = PieceAuth.CustomAuth({
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API key',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest<string[]>({
                method: HttpMethod.GET,
                url: 'https://app.krispcall.com/api/v3/platform/activepiece/me',
                headers: {
                    'X-API-KEY': auth.apiKey,
                },
            })
            return { valid: true }
        } catch (error: any) {
            return { valid: false, error: error.message }
        }
    },
    required: true,
})
