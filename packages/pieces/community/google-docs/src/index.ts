import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { appendText } from './lib/actions/append-text'
import { createDocument } from './lib/actions/create-document'
import { createDocumentBasedOnTemplate } from './lib/actions/create-document-based-on-template.action'
import { findDocumentAction } from './lib/actions/find-document'
import { readDocument } from './lib/actions/read-document.action'
import { GoogleDocsAuthValue, getAccessToken, googleDocsAuth } from './lib/auth'
import { newDocumentTrigger } from './lib/triggers/new-document'

export { GoogleDocsAuthValue, getAccessToken, googleDocsAuth } from './lib/auth'

export const googleDocs = createPiece({
    displayName: 'Google Docs',
    description: 'Create and edit documents online',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/google-docs.png',
    categories: [PieceCategory.CONTENT_AND_FILES],
    authors: ['pfernandez98', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'AbdullahBitar', 'Kevinyu-alan'],
    auth: googleDocsAuth,
    actions: [
        createDocument,
        createDocumentBasedOnTemplate,
        readDocument,
        findDocumentAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://docs.googleapis.com/v1',
            auth: googleDocsAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${await getAccessToken(auth as GoogleDocsAuthValue)}`,
            }),
        }),
        appendText,
    ],
    triggers: [newDocumentTrigger],
})
