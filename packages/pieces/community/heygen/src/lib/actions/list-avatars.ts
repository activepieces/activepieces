import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { heygenAuth } from '../common/auth'
import { heygenApiCall } from '../common/client'

export const listAvatarsAction = createAction({
    auth: heygenAuth,
    name: 'list_avatars',
    displayName: 'List Avatars',
    description: 'Retrieve a list of all available avatars.',
    props: {},
    async run({ auth }) {
        return await heygenApiCall({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            resourceUri: '/avatars',
            apiVersion: 'v2',
        })
    },
})
