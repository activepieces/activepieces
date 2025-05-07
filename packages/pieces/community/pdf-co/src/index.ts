import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { searchAndReplaceText, addTextToPdf, addImageToPdf, convertHtmlToPdf, extractTextFromPdf, convertPdfToStructuredFormat, extractTablesFromPdf, addBarcodeToPdf } from './lib/actions';

export const pdfCoAuth = PieceAuth.SecretText({
  displayName: 'PDF.co API Key',
  description: 'Your PDF.co API Key. Can be found on your PDF.co Dashboard.',
  required: true,
});

export const pdfCo = createPiece({
  displayName: 'PDF.co',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdfco.png',
  auth: pdfCoAuth,
  authors: ['onyedikachi-david'],
  actions: [
    searchAndReplaceText,
    addTextToPdf,
    addImageToPdf,
    convertHtmlToPdf,
    addBarcodeToPdf,
    extractTextFromPdf,
    convertPdfToStructuredFormat,
    extractTablesFromPdf
  ],
  triggers: [],
});
