
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { textCortexAuth } from './lib/common/auth';
import { sendPrompt } from './lib/actions/send-prompt';
import { createParaphrase } from './lib/actions/create-paraphrase';
import { createSocialMediaCaption } from './lib/actions/create-social-media-caption';
import { createTranslation } from './lib/actions/create-translation';
import { createCode } from './lib/actions/create-code';
import { createEmail } from './lib/actions/create-email';
import { createProductDescription } from './lib/actions/create-product-description';
import { createSummary } from './lib/actions/create-summary';

export const textcortexAi = createPiece({
  displayName: 'TextCortex AI',
  auth: textCortexAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/textcortex-ai.png',
  authors: ['aryel780'],
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
      auth: textCortexAuth,
      baseUrl: () => 'https://api.textcortex.com/v1',
      authMapping: async (auth: unknown) => {
        const { token } = auth as { token: string };
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
  triggers: [],
});
    