import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { listVoices } from './lib/actions/list-voices'
import { textToSpeech } from './lib/actions/text-to-speech'
import { translateText } from './lib/actions/translate-text'
import { voiceChange } from './lib/actions/voice-change'
import { murfAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'

export const murfApi = createPiece({
    displayName: 'Murf AI',
    auth: murfAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/murf-api.png',
    authors: ['Niket2035'],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        listVoices,
        translateText,
        voiceChange,
        textToSpeech,
        createCustomApiCallAction({
            auth: murfAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'api-key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [],
})
