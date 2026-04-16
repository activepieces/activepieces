import { HttpMethod } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { extractDataFromDocumentAction } from './lib/actions/extract-data-from-document'
import { uploadDocumentAction } from './lib/actions/upload-document-for-parsing'
import { airparserAuth } from './lib/auth'
import { airparserApiCall } from './lib/common'
import { documentParsedTrigger } from './lib/triggers/document-parsed'

export const airparser = createPiece({
    displayName: 'Airparser',
    description: 'Extract structured data from emails, PDFs, or documents with Airparser.',
    auth: airparserAuth,
    logoUrl: 'https://cdn.activepieces.com/pieces/airparser.png',
    authors: ['krushnarout', 'kishanprmr'],
    categories: [PieceCategory.PRODUCTIVITY],
    actions: [extractDataFromDocumentAction, uploadDocumentAction],
    triggers: [documentParsedTrigger],
})
