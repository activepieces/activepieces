import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { askGrok } from './lib/actions/ask-grok'
import { categorizeText } from './lib/actions/categorize-text'
import { extractDataFromText } from './lib/actions/extract-data'
import { generateImage } from './lib/actions/generate-image'
import { grokAuth } from './lib/common/auth'
import { XAI_BASE_URL } from './lib/common/constants'

export const grokXai = createPiece({
    displayName: 'Grok by xAI',
    description:
        'AI chatbot by xAI that answers questions, generates text, extracts data, and provides real-time insights.',
    auth: grokAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/grok-xai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['sparkybug'],
    actions: [
        askGrok,
        extractDataFromText,
        categorizeText,
        generateImage,
        createCustomApiCallAction({
            auth: grokAuth,
            baseUrl: () => XAI_BASE_URL,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [],
})
