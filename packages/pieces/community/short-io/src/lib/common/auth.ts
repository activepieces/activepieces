import { HttpMethod } from '@activepieces/pieces-common'
import { PieceAuth } from '@activepieces/pieces-framework'
import { AppConnectionType } from '@activepieces/shared'
import { shortIoApiCall } from './client'

export const shortIoAuth = PieceAuth.CustomAuth({
    description: 'Enter your Short.io API Key',
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await shortIoApiCall({
                method: HttpMethod.GET,
                auth: {
                    type: AppConnectionType.CUSTOM_AUTH,
                    props: auth,
                },
                resourceUri: '/api/domains',
            })
            return { valid: true }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key',
            }
        }
    },
    required: true,
})
