import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { youformAuth } from './lib/auth';
import { PieceCategory } from '@activepieces/pieces-framework';
import { youformClient } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-form-submission';

export const youform = createPiece({
  displayName: 'Youform',
  auth: youformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/youform.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    createCustomApiCallAction({
      auth: youformAuth,
      baseUrl: () => youformClient.baseUrl(),
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newSubmissionTrigger],
});
