import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { makePhoneCall } from './lib/actions/make-phone-call'
import { bolnaaiAuth } from './lib/common/auth'
import { callCompletionReport } from './lib/triggers/call-completion-report'

export const bolna = createPiece({
    displayName: 'Bolna AI',
    auth: bolnaaiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/bolna.png',
    authors: ['sanket-a11y'],
    actions: [
        makePhoneCall,
        createCustomApiCallAction({
            auth: bolnaaiAuth,
            baseUrl: () => 'https://api.bolna.ai',
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [callCompletionReport],
})
