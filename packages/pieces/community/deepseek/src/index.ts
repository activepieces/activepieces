import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import OpenAI from 'openai'
import { askDeepseek } from './lib/actions/ask-deepseek'
import { deepseekAuth } from './lib/auth'
import { baseUrl, unauthorizedMessage } from './lib/common/common'

export const deepseek = createPiece({
    displayName: 'DeepSeek',
    auth: deepseekAuth,
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/deepseek.png',
    authors: ['PFernandez98'],
    actions: [askDeepseek],
    triggers: [],
})
