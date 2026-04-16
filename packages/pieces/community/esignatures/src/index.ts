import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createContract } from './lib/actions/create-contract'
import { esignaturesAuth } from './lib/common/auth'

export const esignatures = createPiece({
    displayName: 'eSignatures',
    auth: esignaturesAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/esignatures.png',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.SALES_AND_CRM],
    actions: [
        createContract,
        createCustomApiCallAction({
            baseUrl: () => `https://esignatures.com/api`,
            authLocation: 'queryParams',
            auth: esignaturesAuth,
            authMapping: async (auth) => {
                return {
                    token: `${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})
