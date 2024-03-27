import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { parsePdf } from './lib/actions/parse-pdf';

export const PDF = createPiece({
  displayName: 'PDF',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf.svg',
  authors: ['nyamkamunhjin', 'abuaboud'],
  actions: [parsePdf],
  triggers: [],
});
