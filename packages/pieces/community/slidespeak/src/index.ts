import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createPresentationAction } from './lib/actions/create-presentation'
import { editPresentationAction } from './lib/actions/edit-presentation'
import { getTaskStatusAction } from './lib/actions/get-task-status'
import { uploadDocumentAction } from './lib/actions/upload-document'
import { slidespeakAuth } from './lib/auth'
import { BASE_URL } from './lib/common/constants'
import { newPresentationTrigger } from './lib/triggers/new-presentation'

export const slidespeak = createPiece({
    displayName: 'SlideSpeak',
    auth: slidespeakAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/slidespeak.png',
    authors: ['rimjhimyadav'],
    categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
    actions: [
        createPresentationAction,
        editPresentationAction,
        getTaskStatusAction,
        uploadDocumentAction,
        createCustomApiCallAction({
            auth: slidespeakAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'X-API-key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [newPresentationTrigger],
})
