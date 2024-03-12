import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { tallyFormsNewSubmission } from './lib/triggers/new-submission';
export const tally = createPiece({
  displayName: 'Tally',
  description: 'Receive form submissions from Tally forms',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tally.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["kishanprmr","abuaboud"],
  actions: [],
  triggers: [tallyFormsNewSubmission],
});
