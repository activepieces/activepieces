import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { convertToPdf } from './lib/actions/convert-pdf';
import { generateEinvoice } from './lib/actions/generate-einvoice';
import { polydocAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const polydoc = createPiece({
  displayName: 'PolyDoc',
  description:
    'Convert HTML or a URL to PDF, capture screenshots, and generate EU e-invoices (Factur-X / ZUGFeRD).',
  auth: polydocAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/polydoc.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['polydoc-tech', 'sanket-a11y'],
  actions: [
    convertToPdf,
    captureScreenshot,
    generateEinvoice,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.podio.com',
      auth: polydocAuth,
      authMapping: async (auth: any) => ({
        Authorization: `Bearer ${auth.props.apikey}`,
        'X-Sandbox': auth.props.sandbox ? 'true' : 'false',
      }),
    }),
  ],
  triggers: [],
});
