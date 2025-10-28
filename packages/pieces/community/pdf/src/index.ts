import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { extractText } from './lib/actions/extract-text';
import { convertToImage } from './lib/actions/convert-to-image';
import { textToPdf } from './lib/actions/text-to-pdf';
import { imageToPdf } from './lib/actions/image-to-pdf';
import { pdfPageCount } from './lib/actions/pdf-page-count';
import { extractPdfPages } from './lib/actions/extract-pdf-pages';

export const PDF = createPiece({
  displayName: 'PDF',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.34.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf.svg',
  authors: [
    'nyamkamunhjin',
    'abuaboud',
    'AbdulTheActivepiecer',
    'jmgb27',
    'danielpoonwj',
  ],
  actions: [
    extractText,
    convertToImage,
    textToPdf,
    imageToPdf,
    pdfPageCount,
    extractPdfPages,
  ],
  triggers: [],
});
