import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { generateAltTextAction } from './lib/actions/generate-alt-text'
import { alttextifyAuth } from './lib/common/auth'

export const alttextify = createPiece({
    displayName: 'AltTextify',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: alttextifyAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/alttextify.png',
    authors: ['kishanprmr'],
    actions: [
        generateAltTextAction,
        createCustomApiCallAction({
            auth: alttextifyAuth,
            baseUrl: () => 'https://api.alttextify.net/api/v1',
            authMapping: async (auth) => {
                return {
                    'X-API-Key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [],
})
