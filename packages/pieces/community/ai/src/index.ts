import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { runAgent } from './lib/actions/agents/run-agent'
import { generateImageAction } from './lib/actions/image/generate-image'
import { askAI } from './lib/actions/text/ask-ai'
import { summarizeText } from './lib/actions/text/summarize-text'
import { classifyText } from './lib/actions/utility/classify-text'
import { extractStructuredData } from './lib/actions/utility/extract-structured-data'

export const ai = createPiece({
    displayName: 'AI',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.78.2',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.UNIVERSAL_AI],
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/text-ai.svg',
    authors: ['anasbarg', 'amrdb', 'Louai-Zokerburg'],
    actions: [askAI, summarizeText, generateImageAction, classifyText, extractStructuredData, runAgent],
    triggers: [],
})

export * from './lib/common/ai-sdk'
export * from './lib/common/props'
