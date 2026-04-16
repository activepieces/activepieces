import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { processInputText } from './lib/actions/process-input-text'
import { denserAiAuth } from './lib/common/auth'

export const denserAi = createPiece({
    displayName: 'Denser.ai',
    auth: denserAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/denser-ai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['sanket-a11y'],
    actions: [processInputText],
    triggers: [],
})
