import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { newFormResult } from './lib/triggers/new-form-result'

export const formsiteAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Formsite API Key',
    required: true,
})

export const formsite = createPiece({
    displayName: 'Formsite',
    auth: PieceAuth.None(),
    description: 'Formsite is an online form builder that allows you to create forms and surveys easily.',
    categories: [PieceCategory.SALES_AND_CRM],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/formsite.png',
    authors: ['sanket-a11y'],
    actions: [],
    triggers: [newFormResult],
})
