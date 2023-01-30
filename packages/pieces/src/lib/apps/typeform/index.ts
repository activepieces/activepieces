import { createPiece } from '../../framework/piece';
import { typeformNewSubmission } from './trigger/new-submission';

export const typeform = createPiece({
  name: 'typeform',
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  actions: [],
  triggers: [typeformNewSubmission],
});
