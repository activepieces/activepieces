import { createPiece } from '@activepieces/pieces-framework';
import { typeformNewSubmission } from './lib/trigger/new-submission';

export const typeform = createPiece({
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  actions: [],
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
