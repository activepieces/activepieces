import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addCustomer } from './lib/actions/add-customer'
import { blockKey } from './lib/actions/block-key'
import { createKey } from './lib/actions/create-key'
import { cryptolensAuth } from './lib/common/auth'
import { newApiEvent } from './lib/triggers/new-api-event'

export const cryptolens = createPiece({
    displayName: 'Cryptolens',
    auth: cryptolensAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/cryptolens.png',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.DEVELOPER_TOOLS],
    description:
        'Cryptolens is a Software Licensing as a Service (SLaaS) platform that provides developers with tools to manage software licenses, protect against piracy, and analyze usage data.',
    actions: [
        addCustomer,
        blockKey,
        createKey,
        createCustomApiCallAction({
            auth: cryptolensAuth,
            baseUrl: () => 'https://api.cryptolens.io/api',
            authLocation: 'queryParams',
            authMapping: async (auth) => {
                return {
                    token: `${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [newApiEvent],
})
