import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getKeywords } from './lib/actions/keyword-analysis/get-keywords'
import { getSuggestions } from './lib/actions/keyword-analysis/get-suggestions'
import { serpstatAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'

export const serpstat = createPiece({
    displayName: 'Serpstat',
    auth: serpstatAuth,
    categories: [PieceCategory.PRODUCTIVITY],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/serpstat.png',
    authors: ['geekyme'],
    actions: [
        getKeywords,
        getSuggestions,
        createCustomApiCallAction({
            auth: serpstatAuth,
            baseUrl: () => BASE_URL,
            authLocation: 'queryParams',
            authMapping: async (auth) => {
                return {
                    token: auth.secret_text,
                }
            },
        }),
    ],
    triggers: [],
})
