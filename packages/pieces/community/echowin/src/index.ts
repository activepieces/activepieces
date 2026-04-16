import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createContact } from './lib/actions/create-contact'
import { deleteContact } from './lib/actions/delete-contact'
import { findContactByName } from './lib/actions/find-contact-by-name'
import { echowinAuth } from './lib/common/auth'
import { newContact } from './lib/triggers/new-contact'

export const echowin = createPiece({
    displayName: 'Echowin',
    auth: echowinAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/echowin.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['sanket-a11y'],
    actions: [createContact, deleteContact, findContactByName],
    triggers: [newContact],
})
