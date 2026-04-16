import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { analyzeEmotionsFromUrl } from './lib/actions/analyze-emotions-from-url'
import { createVoice } from './lib/actions/create-voice'
import { deleteVoice } from './lib/actions/delete-voice'
import { generateSpeechFromFile } from './lib/actions/generate-speech-from-file'
import { generateTextToSpeech } from './lib/actions/generate-text-to-speech'
import { getEmotionResults } from './lib/actions/get-emotion-results'
import { humeAiAuth } from './lib/common/auth'
import { newVoiceTrigger } from './lib/triggers/new-voice'

export const humeAi = createPiece({
    displayName: 'Hume AI',
    auth: humeAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/hume-ai.png',
    authors: ['onyedikachi-david'],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        generateTextToSpeech,
        generateSpeechFromFile,
        createVoice,
        deleteVoice,
        analyzeEmotionsFromUrl,
        getEmotionResults,
    ],
    triggers: [newVoiceTrigger],
})
