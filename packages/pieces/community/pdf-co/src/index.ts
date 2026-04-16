import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import {
    addBarcodeToPdf,
    addImageToPdf,
    addTextToPdf,
    convertHtmlToPdf,
    convertPdfToStructuredFormat,
    extractTablesFromPdf,
    extractTextFromPdf,
    searchAndReplaceText,
} from './lib/actions'
import { pdfCoAuth } from './lib/auth'

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
})
