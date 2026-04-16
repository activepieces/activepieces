import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { convertPdfToTextAction } from './lib/actions/convert-pdf-to-text'
import { doctlyAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/constants'

export const doctly = createPiece({
    displayName: 'Doctly AI',
    auth: doctlyAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/doctly.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['kishanprmr'],
    actions: [
        convertPdfToTextAction,
        createCustomApiCallAction({
            auth: doctlyAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})
