import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { typeformNewSubmission } from './lib/trigger/new-submission';

export const typeform = createPiece({
  name: 'typeform',
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  actions: [],
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
