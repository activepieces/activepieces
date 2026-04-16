import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addUser } from './lib/actions/add-user'
import { replyToReview } from './lib/actions/reply-to-review'
import { appfollowAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'
import { newReview } from './lib/triggers/new-review'
import { newTag } from './lib/triggers/new-tag'

export const appfollow = createPiece({
    displayName: 'AppFollow',
    auth: appfollowAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/appfollow.png',
    description: 'Appfollow helps to manage and improve app reviews and ratings.',
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    authors: ['sanket-a11y'],
    actions: [
        addUser,
        replyToReview,
        createCustomApiCallAction({
            auth: appfollowAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => ({
                'X-AppFollow-API-Token': auth.secret_text,
            }),
        }),
    ],
    triggers: [newReview, newTag],
})
