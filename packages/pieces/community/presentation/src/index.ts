import { createPiece } from '@activepieces/pieces-framework';
import { generatePresentations } from './lib/actions/generate-presentations';

import { presentonAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { newPresentation } from './lib/triggers/new-presentation';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const presentation = createPiece({
  displayName: 'Presenton',
  description:
    'Generate AI-powered presentations using Presenton (https://presenton.ai). Supports templates, themes, images, synchronous and asynchronous generation, status polling, and export to PPTX/PDF.',
  auth: presentonAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/presenton.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.CONTENT_AND_FILES,
  ],
  authors: ['sanket-a11y'],
  actions: [
    generatePresentations,
    createCustomApiCallAction({
      auth: presentonAuth,
      baseUrl: () => 'https://api.presenton.ai/api/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [newPresentation],
});
