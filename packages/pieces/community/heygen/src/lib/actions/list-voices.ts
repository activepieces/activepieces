import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { heygenAuth } from '../common/auth'
import { heygenApiCall } from '../common/client'

export const listVoicesAction = createAction({
    auth: heygenAuth,
    name: 'list_voices',
    displayName: 'List Voices',
    description: 'Retrieve a list of all available voices.',
    props: {},
    async run({ auth }) {
        return await heygenApiCall({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            resourceUri: '/voices',
            apiVersion: 'v2',
        })
    },
})
