import { HttpMethod } from '@activepieces/pieces-common'
import { PieceAuth } from '@activepieces/pieces-framework'
import { makeRequest } from './client'

export const omniAuth = PieceAuth.SecretText({
    displayName: 'Omni API Key',
    description: `
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/models', {})
                return {
                    valid: true,
                }
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid Api Key',
                }
            }
        }
        return {
            valid: false,
            error: 'Invalid Api Key',
        }
    },
})
