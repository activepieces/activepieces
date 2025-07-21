
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { generateTextAction } from './lib/actions/generate-text';
    import { summarizeTextAction } from './lib/actions/summarize-text';
    import { extractKeywordsAction } from './lib/actions/extract-keywords';
    import { detectLanguageAction } from './lib/actions/detect-language';
    import { extractEntitiesAction } from './lib/actions/extract-entities';
    import { moderateTextAction } from './lib/actions/moderate-text';
    import { spellCheckAction } from './lib/actions/spell-check';
    import { translateTextAction } from './lib/actions/translate-text';
    import { invoiceParserAction } from './lib/actions/invoice-parser';
    import { receiptParserAction } from './lib/actions/receipt-parser';
    import { ocrImageAction } from './lib/actions/ocr-image';
    import { imageGenerationAction } from './lib/actions/image-generation';
    import { textToSpeechAction } from './lib/actions/text-to-speech';
    import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceCategory } from "@activepieces/shared";

    export const edenAiAuth = PieceAuth.SecretText({
      displayName: 'Eden AI API Key',
      description: `You can obtain your API key from your [Eden AI dashboard](https://app.edenai.run/admin/account/developer).`,
      required: true,
      validate: async ({ auth }) => {
        if (!auth || typeof auth !== 'string' || auth.length < 10) {
          return { valid: false, error: 'Invalid API key format.' };
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.edenai.run/v2/translation/language_detection',
            headers: {
              'Authorization': `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
            body: { providers: 'google', text: 'hello' },
            timeout: 10000,
          });
          if (response.status >= 200 && response.status < 300) {
            return { valid: true };
          }
          return { valid: false, error: 'Invalid Eden AI API key.' };
        } catch (e: any) {
          return { valid: false, error: 'Invalid Eden AI API key or network error.' };
        }
      },
    });

    export const edenAi = createPiece({
      displayName: "Eden AI",
      auth: edenAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/eden-ai.png",
      authors: ["sparkybug"],
      description: "Eden AI is a platform that provides a range of AI services, including text generation, summarization, translation, and more.",
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
    });
    