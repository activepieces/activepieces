import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { createCredential } from './lib/actions/create-credential'
import { certopusAuth } from './lib/auth'
import { certopusCommon } from './lib/common'

export const certopus = createPiece({
    displayName: 'Certopus',
    description: 'Your certificates, made simple',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
    categories: [],
    authors: ['VrajGohil', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
    auth: certopusAuth,
    actions: [
        createCredential,
        createCustomApiCallAction({
            baseUrl: () => certopusCommon.baseUrl, // Replace with the actual base URL
            auth: certopusAuth,
            authMapping: async (auth) => ({
                'x-api-key': `${auth}`,
            }),
        }),
    ],
    triggers: [],
})
