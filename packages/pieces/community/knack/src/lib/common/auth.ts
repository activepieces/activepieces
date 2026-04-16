import { HttpMethod } from '@activepieces/pieces-common'
import { PieceAuth, Property } from '@activepieces/pieces-framework'
import { AppConnectionType } from '@activepieces/shared'
import { knackApiCall } from './client'

export const knackAuth = PieceAuth.CustomAuth({
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Your Knack API Key available in the Settings section of the Builder.',
            required: true,
        }),
        applicationId: Property.ShortText({
            displayName: 'Application ID',
            description: 'Your Application ID available in the Settings section of the Builder.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await knackApiCall({
                method: HttpMethod.GET,
                auth: {
                    type: AppConnectionType.CUSTOM_AUTH,
                    props: auth,
                },
                resourceUri: '/objects',
            })
            return { valid: true }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key or Application ID',
            }
        }
    },
    required: true,
})
