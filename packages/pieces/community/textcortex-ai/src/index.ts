
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { textcortexAuth } from './lib/common/auth';
import { baseUrl } from './lib/common/common';
import { sendPrompt } from './lib/actions/send-prompt';
import { createParaphrase } from './lib/actions/create-paraphrase';
import { createSocialMediaCaption } from './lib/actions/create-social-caption';
import { createTranslation } from './lib/actions/create-translation';
import { createCode } from './lib/actions/create-code';
import { createEmail } from './lib/actions/create-email';
import { createProductDescription } from './lib/actions/create-product-description';
import { createSummary } from './lib/actions/create-summary';

export const textcortexAi = createPiece({
  displayName: 'TextCortex AI',
  description: 'AI-powered writing assistant for content creation, code generation, translations, and more using multiple AI models.',
  auth: textcortexAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/textcortex-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['owuzo', 'onyedikachi-david'],
  actions: [
    sendPrompt,
    createParaphrase,
    createSocialMediaCaption,
    createTranslation,
    createCode,
    createEmail,
    createProductDescription,
    createSummary,
    createCustomApiCallAction({
      auth: textcortexAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});