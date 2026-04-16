import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { AppConnectionType, PieceCategory } from '@activepieces/shared'
import { createEntryAction } from './lib/actions/create-entry'
import { deleteEntryAction } from './lib/actions/delete-entry'
import { getEntryAction } from './lib/actions/get-entry'
import { updateEntryAction } from './lib/actions/update-entry'
import { cognitoFormsAuth } from './lib/auth'
import { makeRequest } from './lib/common'
import { entryUpdatedTrigger } from './lib/triggers/entry-updated'
import { newEntryTrigger } from './lib/triggers/new-entry-submitted'

export const cognitoForms = createPiece({
    displayName: 'Cognito Forms',
    auth: cognitoFormsAuth,
    logoUrl: 'https://cdn.activepieces.com/pieces/cognito-forms.png',
    authors: ['krushnarout'],
    categories: [PieceCategory.PRODUCTIVITY, PieceCategory.FORMS_AND_SURVEYS],
    actions: [
        createEntryAction,
        updateEntryAction,
        deleteEntryAction,
        getEntryAction,
        createCustomApiCallAction({
            auth: cognitoFormsAuth,
            baseUrl: () => 'https://www.cognitoforms.com/api',
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth}`,
                }
            },
        }),
    ],
    triggers: [newEntryTrigger, entryUpdatedTrigger],
})
