import { createPiece } from '@activepieces/framework';
import { typeformNewSubmission } from './trigger/new-submission';

export const typeform = createPiece({
  name: 'typeform',
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  actions: [],
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
