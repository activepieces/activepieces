import { createPiece } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from './lib/common/auth';
import { urlToPdfAction } from './lib/actions/url-to-pdf';
import { htmlToPdfAction } from './lib/actions/html-to-pdf';
import { convertToPdfAiAction } from './lib/actions/convert-to-pdf-ai';
import { convertToImageAction } from './lib/actions/convert-to-image';
import { mergePdfsAction } from './lib/actions/merge-pdfs';
import { editPdfPagesAction } from './lib/actions/edit-pdf-pages';
import { pdfToImageAction } from './lib/actions/pdf-to-image';
import { pdfToTextAction } from './lib/actions/pdf-to-text';
import { pdfToHtmlAction } from './lib/actions/pdf-to-html';
import { imageToPdfAction } from './lib/actions/image-to-pdf';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

export const pdfcrowd = createPiece({
  displayName: 'Pdfcrowd',
  auth: pdfcrowdAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdfcrowd.png',
  authors: ['pdfcrowd', 'sanket-a11y'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  description:
    'Convert web pages and HTML to PDF with advanced formatting options',
  actions: [
    urlToPdfAction,
    htmlToPdfAction,
    convertToPdfAiAction,
    convertToImageAction,
    mergePdfsAction,
    editPdfPagesAction,
    pdfToImageAction,
    pdfToTextAction,
    pdfToHtmlAction,
    imageToPdfAction,
    createCustomApiCallAction({
      auth: pdfcrowdAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Basic ${Buffer.from(
            `${auth.username}:${auth.password}`
          ).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [],
});
