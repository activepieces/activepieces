import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { pdf4meAuth } from './lib/auth';
import { pdf4meCommon } from './lib/common';
import { convertToPdfAction } from './lib/actions/convert-to-pdf';
import { mergePdfsAction } from './lib/actions/merge-pdfs';
import { splitPdfAction } from './lib/actions/split-pdf';
import { compressPdfAction } from './lib/actions/compress-pdf';
import { protectPdfAction } from './lib/actions/protect-pdf';
import { pdfToWordAction } from './lib/actions/pdf-to-word';
import { pdfToImageAction } from './lib/actions/pdf-to-image';

export { pdf4meAuth };

export const pdf4me = createPiece({
  displayName: 'PDF4me',
  description: 'Convert, merge, split, compress, and protect PDF documents.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf4me.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: pdf4meAuth,
  authors: ['onyedikachi-david'],
  actions: [
    convertToPdfAction,
    mergePdfsAction,
    splitPdfAction,
    compressPdfAction,
    protectPdfAction,
    pdfToWordAction,
    pdfToImageAction,
    createCustomApiCallAction({
      baseUrl: () => pdf4meCommon.BASE_URL,
      auth: pdf4meAuth,
      authMapping: async (auth) => ({
        Authorization: auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
