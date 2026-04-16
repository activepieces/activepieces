import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createPost } from './lib/actions/create-post'
import { findPost } from './lib/actions/find-post'
import { findThread } from './lib/actions/find-thread'
import { likePost } from './lib/actions/like-post'
import { repostPost } from './lib/actions/repost'
import { blueskyAuth } from './lib/common/auth'
import { newFollowerOnAccount } from './lib/triggers/new-follower-on-account'
import { newPost } from './lib/triggers/new-post'
import { newPostsByAuthor } from './lib/triggers/new-posts-by-author'
import { newTimelinePosts } from './lib/triggers/new-timeline-posts'

export { blueskyAuth } from './lib/common/auth'
export { createBlueskyAgent } from './lib/common/client'

export const bluesky = createPiece({
    displayName: 'Bluesky',
    auth: blueskyAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/bluesky.png',
    authors: ['Sanket6652'],
    categories: [PieceCategory.COMMUNICATION],
    actions: [createPost, likePost, repostPost, findPost, findThread],
    triggers: [newPostsByAuthor, newFollowerOnAccount, newTimelinePosts, newPost],
})
