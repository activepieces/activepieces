import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { convertToPdf } from './lib/actions/convert-pdf';
import { generateEinvoice } from './lib/actions/generate-einvoice';
import { polydocAuth } from './lib/common/auth';

export const polydoc = createPiece({
  displayName: 'PolyDoc',
  description:
    'Convert HTML or a URL to PDF, capture screenshots, and generate EU e-invoices (Factur-X / ZUGFeRD).',
  auth: polydocAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://polydoc.tech/logo.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['polydoc-tech'],
  actions: [convertToPdf, captureScreenshot, generateEinvoice],
  triggers: [],
});
