import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createFormAction } from './lib/actions/create-form';
import { listSubmissionsAction } from './lib/actions/list-submissions';
import { formgongAuth } from './lib/auth';
import { FORMGONG_BASE_URL } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-submission';

export const formgong = createPiece({
  displayName: 'Formgong',
  description:
    'Form backend for websites: receive form submissions by email, Telegram and webhooks.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/formgong.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  auth: formgongAuth,
  authors: ['formgong-hq'],
  actions: [
    createFormAction,
    listSubmissionsAction,
    createCustomApiCallAction({
      baseUrl: () => FORMGONG_BASE_URL,
      auth: formgongAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newSubmissionTrigger],
});
