import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { parsePdfFromUrl } from './lib/actions/parse-pdf-from-url';

export const PDF = createPiece({
  displayName: 'PDF',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.0.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/PDF.png',
  authors: ['nyamkamunhjin'],
  actions: [parsePdfFromUrl, parsePdfFromUrl],
  triggers: [],
});
