import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { gravityFormsNewSubmission } from './lib/triggers/new-submission';

export const gravityforms = createPiece({
  displayName: 'Gravity Forms',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.6.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gravityforms.svg',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['abdallah-alwarawreh'],
  actions: [],
  triggers: [gravityFormsNewSubmission],
});
