import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { deleteTemplateAction } from './lib/actions/delete-template'
import { listCategoriesAction } from './lib/actions/list-categories'
import { listTagsAction } from './lib/actions/list-tags'
import { listTemplatesAction } from './lib/actions/list-templates'
import { renderDocumentAction } from './lib/actions/render-document'
import { updateTemplateAction } from './lib/actions/update-template'
import { uploadTemplateAction } from './lib/actions/upload-template'
import { carboneAuth } from './lib/auth'
import { CARBONE_API_URL } from './lib/common/constants'

export const carbone = createPiece({
    displayName: 'Carbone',
    description:
        'Generate documents (PDF, DOCX, XLSX, ODS, and more) from templates and JSON data using the Carbone report generator.',
    auth: carboneAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/carbone.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['Harmatta', 'onyedikachi-david'],
    actions: [
        renderDocumentAction,
        uploadTemplateAction,
        deleteTemplateAction,
        updateTemplateAction,
        listTemplatesAction,
        listCategoriesAction,
        listTagsAction,
        createCustomApiCallAction({
            auth: carboneAuth,
            baseUrl: () => CARBONE_API_URL,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
})
