import { createPiece } from '@activepieces/framework';
import { typeformNewSubmission } from './trigger/new-submission';

export const typeform = createPiece({
  name: 'typeform',
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  version: '0.0.0',
  actions: [],
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
