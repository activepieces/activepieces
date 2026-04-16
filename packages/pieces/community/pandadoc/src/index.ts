import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createAttachment } from './lib/actions/create-attachment'
import { createDocumentFromTemplate } from './lib/actions/create-document-from-template'
import { createOrUpdateContact } from './lib/actions/create-or-update-contact'
import { downloadDocument } from './lib/actions/download-document'
import { findDocument } from './lib/actions/find-document'
import { getDocumentAttachments } from './lib/actions/get-document-attachments'
import { getDocumentDetails } from './lib/actions/get-document-details'
import { pandadocAuth } from './lib/common'
import { documentCompleted } from './lib/triggers/document-completed'
import { documentStateChanged } from './lib/triggers/document-state-changed'
import { documentUpdated } from './lib/triggers/document-updated'

export const pandadoc = createPiece({
    displayName: 'PandaDoc',
    auth: pandadocAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/pandadoc.png',
    categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
    authors: ['onyedikachi-david'],
    actions: [
        createDocumentFromTemplate,
        createAttachment,
        createOrUpdateContact,
        findDocument,
        getDocumentAttachments,
        getDocumentDetails,
        downloadDocument,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.pandadoc.com/public/v1',
            auth: pandadocAuth,
            authMapping: async (auth) => ({
                Authorization: `API-Key ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [documentCompleted, documentStateChanged, documentUpdated],
})
