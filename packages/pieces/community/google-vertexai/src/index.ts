import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { customApiCall, generateContent, generateImage } from './lib/actions'
import { vertexAiAuth } from './lib/auth'

export const googleVertexai = createPiece({
    displayName: 'Google Vertex AI',
    description: 'Generate content and images using Gemini and Imagen models on Google Vertex AI.',
    auth: vertexAiAuth,
    minimumSupportedRelease: '0.71.4',
    logoUrl: 'https://cdn.activepieces.com/pieces/google-vertexai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['alinperghel', 'onyedikachi-david', 'bertrandong'],
    actions: [generateContent, generateImage, customApiCall],
    triggers: [],
})

export { GoogleVertexAIAuthValue, vertexAiAuth } from './lib/auth'
