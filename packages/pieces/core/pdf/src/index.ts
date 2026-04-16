import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addTextToPdf } from './lib/actions/add-text-to-pdf'
import { convertToImage } from './lib/actions/convert-to-image'
import { extractPdfPages } from './lib/actions/extract-pdf-pages'
import { extractText } from './lib/actions/extract-text'
import { imageToPdf } from './lib/actions/image-to-pdf'
import { mergePdfs } from './lib/actions/merge-pdfs'
import { pdfPageCount } from './lib/actions/pdf-page-count'
import { textToPdf } from './lib/actions/text-to-pdf'

export const PDF = createPiece({
    displayName: 'PDF',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.34.2',
    logoUrl: 'https://cdn.activepieces.com/pieces/pdf.svg',
    authors: ['nyamkamunhjin', 'abuaboud', 'AbdulTheActivepiecer', 'jmgb27', 'danielpoonwj', 'bertrandong'],
    categories: [PieceCategory.CORE],
    actions: [
        extractText,
        convertToImage,
        textToPdf,
        imageToPdf,
        pdfPageCount,
        extractPdfPages,
        mergePdfs,
        addTextToPdf,
    ],
    triggers: [],
})
