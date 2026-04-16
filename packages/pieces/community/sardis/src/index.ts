import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { checkBalanceAction } from './lib/actions/check-balance'
import { checkPolicyAction } from './lib/actions/check-policy'
import { listTransactionsAction } from './lib/actions/list-transactions'
import { sendPaymentAction } from './lib/actions/send-payment'
import { setSpendingPolicyAction } from './lib/actions/set-policy'
import { sardisAuth } from './lib/auth'

export const sardis = createPiece({
    displayName: 'Sardis',
    description: 'Policy-controlled payments for AI agents.',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/sardis.png',
    authors: ['EfeDurmaz16', 'onyedikachi-david'],
    categories: [PieceCategory.PAYMENT_PROCESSING],
    auth: sardisAuth,
    actions: [
        sendPaymentAction,
        checkBalanceAction,
        checkPolicyAction,
        setSpendingPolicyAction,
        listTransactionsAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.sardis.sh/api/v2',
            auth: sardisAuth,
            authMapping: async (auth) => ({
                'X-API-Key': auth.secret_text,
            }),
        }),
    ],
    triggers: [],
})
