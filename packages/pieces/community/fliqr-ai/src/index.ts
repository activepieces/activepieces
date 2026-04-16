import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getFliqrAccountDetails } from './lib/actions/get-account-details'
import { getFliqrAccountFlows } from './lib/actions/get-account-flows'
import { fliqrAuth } from './lib/auth'
import { fliqrConfig } from './lib/common/models'

export const fliqrAi = createPiece({
    displayName: 'Fliqr AI',
    description:
        'Omnichannel AI chatbot enhancing customer interactions across WhatsApp, Facebook, Instagram, Telegram, and 6 other platforms.',

    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/fliqr-ai.png',
    authors: ['drona2938'],
    categories: [PieceCategory.COMMUNICATION, PieceCategory.CUSTOMER_SUPPORT, PieceCategory.MARKETING],
    auth: fliqrAuth,
    actions: [
        getFliqrAccountDetails,
        getFliqrAccountFlows,
        createCustomApiCallAction({
            baseUrl: () => fliqrConfig.baseUrl,
            auth: fliqrAuth,
            authMapping: async (auth) => ({
                [fliqrConfig.accessTokenHeaderKey]: `${auth}`,
            }),
        }),
    ],
    triggers: [],
})
