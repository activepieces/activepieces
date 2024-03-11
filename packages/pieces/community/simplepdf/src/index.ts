import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { simplePDFNewSubmission } from './lib/triggers/new-submission';

export const simplepdf = createPiece({
  displayName: 'SimplePDF',
  description: 'Effortlessly convert documents to PDF',

  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplepdf.png',
  authors: ['bendersej'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [],
  triggers: [simplePDFNewSubmission],
});
