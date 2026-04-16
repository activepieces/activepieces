import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { checkPlagiarism } from './lib/actions/check-plagiarism'
import { detectAiContent } from './lib/actions/detect-ai-content'
import { humanizeText } from './lib/actions/humanize-text'
import { BASE_URL, detectingAiAuth } from './lib/common'

export const detectingAi = createPiece({
    displayName: 'DETECTING-AI.COM',
    auth: detectingAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/detecting-ai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['onyedikachi-david'],
    actions: [
        detectAiContent,
        checkPlagiarism,
        humanizeText,
        createCustomApiCallAction({
            auth: detectingAiAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'X-API-Key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [],
})
