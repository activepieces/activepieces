import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { extractText } from './lib/actions/extract-text';
import { convertToImage } from './lib/actions/convert-to-image';
import { textToPdf } from './lib/actions/text-to-pdf';
import { imageToPdf } from './lib/actions/image-to-pdf';

export const PDF = createPiece({
  displayName: 'PDF',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.34.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf.svg',
  authors: ['nyamkamunhjin', 'abuaboud','AbdulTheActivepiecer','jmgb27'],
  actions: [extractText, convertToImage, textToPdf,imageToPdf],
  triggers: [],
});

