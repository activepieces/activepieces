import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {
	searchAndReplaceText,
	addTextToPdf,
	addImageToPdf,
	convertHtmlToPdf,
	extractTextFromPdf,
	convertPdfToStructuredFormat,
	extractTablesFromPdf,
	addBarcodeToPdf,
} from './lib/actions';
import { PieceCategory } from '@activepieces/shared';

export const pdfCoAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your PDF.co API key please [click here to create your account](https://app.pdf.co/).`,
	required: true,
});

export const pdfCo = createPiece({
	displayName: 'PDF.co',
	description: 'Automate PDF conversion, editing, extraction',
	categories: [PieceCategory.PRODUCTIVITY, PieceCategory.CONTENT_AND_FILES],
	logoUrl: 'https://cdn.activepieces.com/pieces/pdf-co.png',
	auth: pdfCoAuth,
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		addBarcodeToPdf,
		addImageToPdf,
		addTextToPdf,
		convertHtmlToPdf,
		convertPdfToStructuredFormat,
		extractTablesFromPdf,
		extractTextFromPdf,
		searchAndReplaceText,
	],
	triggers: [],
});
