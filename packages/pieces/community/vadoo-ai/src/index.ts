import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { generateAiCaptions } from './lib/actions/generate-ai-captions'
import { generateAiImage } from './lib/actions/generate-ai-image'
import { generatePodcast } from './lib/actions/generate-podcast'
import { generateVideo } from './lib/actions/generate-video'
import { vadooAiAuth } from './lib/auth'

export const vadooAi = createPiece({
    displayName: 'Vadoo AI',
    auth: vadooAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/vadoo-ai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['fortunamide'],
    actions: [generateVideo, generatePodcast, generateAiImage, generateAiCaptions],
    triggers: [],
})
