import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { sendMessage } from './lib/actions/send-message'
import { chatwootAuth } from './lib/auth'
import { CHATWOOT_AUTH_HEADER } from './lib/common/constants'
import { getChatwootAuth } from './lib/common/types'
import { newMessage } from './lib/triggers/new-message'

export const chatwoot = createPiece({
    displayName: 'Chatwoot',
    description: 'Receive and reply to customer messages with Chatwoot',
    auth: chatwootAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/chatwoot.png',
    authors: ['AhmadTash'],
    actions: [
        sendMessage,
        createCustomApiCallAction({
            auth: chatwootAuth,
            baseUrl: (auth) => {
                const authValue = getChatwootAuth(auth!)
                return authValue.baseUrl
            },
            authMapping: async (auth) => {
                const authValue = getChatwootAuth(auth!)
                return {
                    [CHATWOOT_AUTH_HEADER]: authValue.apiAccessToken,
                }
            },
        }),
    ],
    triggers: [newMessage],
})
