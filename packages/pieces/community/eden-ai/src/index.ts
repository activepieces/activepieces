import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { detectLanguageAction } from './lib/actions/detect-language'
import { extractEntitiesAction } from './lib/actions/extract-entities'
import { extractKeywordsAction } from './lib/actions/extract-keywords'
import { generateTextAction } from './lib/actions/generate-text'
import { imageGenerationAction } from './lib/actions/image-generation'
import { invoiceParserAction } from './lib/actions/invoice-parser'
import { moderateTextAction } from './lib/actions/moderate-text'
import { ocrImageAction } from './lib/actions/ocr-image'
import { receiptParserAction } from './lib/actions/receipt-parser'
import { spellCheckAction } from './lib/actions/spell-check'
import { summarizeTextAction } from './lib/actions/summarize-text'
import { textToSpeechAction } from './lib/actions/text-to-speech'
import { translateTextAction } from './lib/actions/translate-text'

export const edenAiAuth = PieceAuth.SecretText({
    displayName: 'Eden AI API Key',
    description: `You can obtain your API key from your [Eden AI dashboard](https://app.edenai.run/admin/api-settings/features-preferences).`,
    required: true,
    validate: async ({ auth }) => {
        if (!auth || typeof auth !== 'string' || auth.length < 10) {
            return { valid: false, error: 'Invalid API key format.' }
        }
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.edenai.run/v2/video/explicit_content_detection_async',
                headers: {
                    Authorization: `Bearer ${auth}`,
                    'Content-Type': 'application/json',
                },
            })
            if (response.status >= 200 && response.status < 300) {
                return { valid: true }
            }
            return { valid: false, error: 'Invalid Eden AI API key.' }
        } catch (e: any) {
            return { valid: false, error: 'Invalid Eden AI API key or network error.' }
        }
    },
})

export const edenAi = createPiece({
    displayName: 'Eden AI',
    auth: edenAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/eden-ai.png',
    authors: ['sparkybug'],
    description:
        'Eden AI is a platform that provides a range of AI services, including text generation, summarization, translation, and more.',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        generateTextAction,
        summarizeTextAction,
        extractKeywordsAction,
        detectLanguageAction,
        extractEntitiesAction,
        moderateTextAction,
        spellCheckAction,
        translateTextAction,
        invoiceParserAction,
        receiptParserAction,
        ocrImageAction,
        imageGenerationAction,
        textToSpeechAction,
    ],
    triggers: [],
})
