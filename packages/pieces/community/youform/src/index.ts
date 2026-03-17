import { createPiece } from '@activepieces/pieces-framework';
import { youformAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { newSubmissionTrigger } from './lib/triggers/new-form-submission';

export const youform = createPiece({
  displayName: 'Youform',
  auth: youformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/youform.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [],
  triggers: [newSubmissionTrigger],
});
