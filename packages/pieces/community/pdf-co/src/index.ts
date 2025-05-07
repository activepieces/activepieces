import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { searchAndReplaceTextInPdf } from './lib/actions/search-and-replace-text-in-pdf';
import { addTextOrImageToPdf } from './lib/actions/add-text-or-image-to-pdf';
import { addBarcodeToPdf } from './lib/actions/add-barcode-to-pdf';
import { htmlToPdf } from './lib/actions/html-to-pdf';
import { extractTextFromPdf } from './lib/actions/extract-text-from-pdf';
import { convertPdfToJsonCsvXml } from './lib/actions/convert-pdf-to-json-csv-xml';
import { extractTablesFromPdf } from './lib/actions/extract-tables-from-pdf';

export const pdfCoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const pdfCo = createPiece({
  displayName: 'Pdf-co',
  auth: pdfCoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdf-co.png',
  authors: [],
  actions: [
    searchAndReplaceTextInPdf,
    addTextOrImageToPdf,
    addBarcodeToPdf,
    htmlToPdf,
    extractTextFromPdf,
    convertPdfToJsonCsvXml,
    extractTablesFromPdf
  ],
  triggers: [],
});
