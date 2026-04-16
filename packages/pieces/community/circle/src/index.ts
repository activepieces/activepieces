import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { addMemberToSpace } from './lib/actions/add-member-to-space'
import { createComment } from './lib/actions/create-comment'
import { createPost } from './lib/actions/create-post'
import { findMemberByEmail } from './lib/actions/find-member-by-email'
import { getMemberDetails } from './lib/actions/get-member-details'
import { getPostDetailsAction } from './lib/actions/get-post-details'
import { BASE_URL } from './lib/common'
import { circleAuth } from './lib/common/auth'
import { newMemberAdded } from './lib/triggers/new-member-added'
import { newPostCreated } from './lib/triggers/new-post'

export const circle = createPiece({
    displayName: 'Circle',
    logoUrl: 'https://cdn.activepieces.com/pieces/circle.png',
    description: 'Circle.so is a platform for creating and managing communities.',
    auth: circleAuth,
    minimumSupportedRelease: '0.36.1',
    authors: ['onyedikachi-david', 'kishanprmr'],
    actions: [
        createPost,
        createComment,
        addMemberToSpace,
        findMemberByEmail,
        getPostDetailsAction,
        getMemberDetails,
        createCustomApiCallAction({
            auth: circleAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth}`,
                }
            },
        }),
    ],
    triggers: [newPostCreated, newMemberAdded],
})
