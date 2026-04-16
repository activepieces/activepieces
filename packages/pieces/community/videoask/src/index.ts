import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addTagToContact } from './lib/actions/add-tag-to-contact'
import { createContact } from './lib/actions/create-contact'
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact'
import { searchForm } from './lib/actions/search-form'
import { updateContact } from './lib/actions/update-contact'
import { videoaskAuth } from './lib/common/auth'
import { makeRequest } from './lib/common/client'
import { organizationIdDropdown } from './lib/common/props'
import { formContactMessage } from './lib/triggers/form-contact-message'
import { formTranscribed } from './lib/triggers/form-transcribed'
import { newFormAuthorResponse } from './lib/triggers/new-form-author-response'
import { newFormResponse } from './lib/triggers/new-form-response'

export const videoask = createPiece({
    displayName: 'VideoAsk',
    auth: videoaskAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/videoask.png',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.FORMS_AND_SURVEYS],
    actions: [
        addTagToContact,
        createContact,
        removeTagFromContact,
        searchForm,
        updateContact,
        createCustomApiCallAction({
            auth: videoaskAuth,
            baseUrl: () => 'https://api.videoask.com',
            authMapping: async (auth, propsValue) => {
                return {
                    Authorization: `Bearer ${auth.access_token}`,
                    'Content-Type': 'application/json',
                    'organization-id': propsValue['organizationId'],
                }
            },
            extraProps: {
                organizationId: organizationIdDropdown,
            },
        }),
    ],
    triggers: [formContactMessage, formTranscribed, newFormResponse, newFormAuthorResponse],
})
