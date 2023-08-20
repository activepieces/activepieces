import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { simplePDFNewSubmission } from './lib/triggers/new-submission';

export const simplepdf = createPiece({
  displayName: 'SimplePDF',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplepdf.png',
  authors: ['bendersej'],
  actions: [],
  triggers: [simplePDFNewSubmission],
});
