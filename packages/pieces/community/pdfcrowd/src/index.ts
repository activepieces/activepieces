import { createPiece } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from './lib/common/auth';
import { urlToPdfAction } from './lib/actions/url-to-pdf';
import { htmlToPdfAction } from './lib/actions/html-to-pdf';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

export const pdfcrowd = createPiece({
  displayName: 'Pdfcrowd',
  auth: pdfcrowdAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://storage.googleapis.com/pdfcrowd-cdn/images/integration_icon.png',
  authors: ['pdfcrowd', 'sanket-a11y'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  description:
    'Convert web pages and HTML to PDF with advanced formatting options',
  actions: [
    urlToPdfAction,
    htmlToPdfAction,
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
