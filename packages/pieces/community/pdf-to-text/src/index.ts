import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { parseTextFromPdfFile } from './lib/actions/pdf-to-text';

export const pdfToText = createPiece({
  displayName: 'Pdf-to-text',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf-to-text.png',
  authors: [],
  actions: [parseTextFromPdfFile],
  triggers: [],
});
