import { createPiece } from '@activepieces/pieces-framework'
import { sendEmailAction } from './lib/actions/send-email'
import { PieceCategory } from '@activepieces/shared'
import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { emailitAuth } from './lib/auth'

export const emailit = createPiece({
    displayName: 'Emailit',
    description: 'Send transactional emails with Emailit',
    logoUrl: 'https://cdn.activepieces.com/pieces/emailit.svg',
    categories: [PieceCategory.COMMUNICATION, PieceCategory.PRODUCTIVITY],
    authors: ['dennisklappe', 'onyedikachi-david'],
    auth: emailitAuth,
    actions: [
        sendEmailAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.emailit.com/v2',
            auth: emailitAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
})
