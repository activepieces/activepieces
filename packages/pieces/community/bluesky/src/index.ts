import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { blueskyAuth } from './lib/common/auth';
import { blueskyClient } from './lib/common/client';
import { createPost } from './lib/actions/create-post';
import { likePost } from './lib/actions/like-post';
import { repostPost } from './lib/actions/repost';
import { findPost } from './lib/actions/find-post';
import { findThread } from './lib/actions/find-thread';
import { deletePost } from './lib/actions/delete-post';
import { unlikePost } from './lib/actions/unlike-post';
import { undoRepost } from './lib/actions/undo-repost';
import { getProfile } from './lib/actions/get-profile';
import { searchUsers } from './lib/actions/search-users';
import { searchPosts } from './lib/actions/search-posts';
import { followUser } from './lib/actions/follow-user';
import { unfollowUser } from './lib/actions/unfollow-user';
import { blockUser } from './lib/actions/block-user';
import { unblockUser } from './lib/actions/unblock-user';
import { muteUser } from './lib/actions/mute-user';
import { unmuteUser } from './lib/actions/unmute-user';
import { getAuthorFeed } from './lib/actions/get-author-feed';
import { getTimeline } from './lib/actions/get-timeline';
import { getPostLikes } from './lib/actions/get-post-likes';
import { getPostReposts } from './lib/actions/get-post-reposts';
import { getPostQuotes } from './lib/actions/get-post-quotes';
import { listFollowers } from './lib/actions/list-followers';
import { listFollows } from './lib/actions/list-follows';
import { listNotifications } from './lib/actions/list-notifications';
import { markNotificationsSeen } from './lib/actions/mark-notifications-seen';
import { updateProfile } from './lib/actions/update-profile';
import { listMyLists } from './lib/actions/list-my-lists';
import { getListMembers } from './lib/actions/get-list-members';
import { createList } from './lib/actions/create-list';
import { deleteList } from './lib/actions/delete-list';
import { addUserToList } from './lib/actions/add-user-to-list';
import { removeUserFromList } from './lib/actions/remove-user-from-list';
import { blueskyCreatePost } from './lib/actions/bluesky-create-post';
import { blueskyLikePost } from './lib/actions/bluesky-like-post';
import { blueskyRepostPost } from './lib/actions/bluesky-repost-post';
import { blueskyGetPosts } from './lib/actions/bluesky-get-posts';
import { blueskyResolveHandle } from './lib/actions/bluesky-resolve-handle';
import { blueskyGetUnreadCount } from './lib/actions/bluesky-get-unread-count';
import { newPostsByAuthor } from './lib/triggers/new-posts-by-author';
import { newFollowerOnAccount } from './lib/triggers/new-follower-on-account';
import { newTimelinePosts } from './lib/triggers/new-timeline-posts';
import { newPost } from './lib/triggers/new-post';
import { newNotification } from './lib/triggers/new-notification';
import { newMention } from './lib/triggers/new-mention';

export const bluesky = createPiece({
  displayName: 'Bluesky',
  description: 'Decentralized social network built on the AT Protocol.',
  auth: blueskyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/bluesky.png',
  authors: ['Sanket6652'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    createPost,
    likePost,
    repostPost,
    findPost,
    findThread,
    deletePost,
    unlikePost,
    undoRepost,
    getProfile,
    searchUsers,
    searchPosts,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    getAuthorFeed,
    getTimeline,
    getPostLikes,
    getPostReposts,
    getPostQuotes,
    listFollowers,
    listFollows,
    listNotifications,
    markNotificationsSeen,
    updateProfile,
    listMyLists,
    getListMembers,
    createList,
    deleteList,
    addUserToList,
    removeUserFromList,
    blueskyCreatePost,
    blueskyLikePost,
    blueskyRepostPost,
    blueskyGetPosts,
    blueskyResolveHandle,
    blueskyGetUnreadCount,
    createCustomApiCallAction({
      auth: blueskyAuth,
      baseUrl: (auth) => `${blueskyClient.normalizePdsHost(auth?.props.pdsHost)}/xrpc`,
      description: 'Make a custom XRPC call to your Bluesky PDS, for example /app.bsky.actor.getProfile?actor=bsky.app',
      authMapping: async (auth, propsValue) => {
        const pdsHost = blueskyClient.normalizePdsHost(auth.props.pdsHost);
        blueskyClient.assertSameOrigin({ url: customUrl(propsValue), pdsHost });
        return { Authorization: `Bearer ${await blueskyClient.freshAccessToken(auth.props)}` };
      },
    }),
  ],
  triggers: [newPostsByAuthor, newFollowerOnAccount, newTimelinePosts, newPost, newNotification, newMention],
});

function customUrl(propsValue: unknown): unknown {
  if (typeof propsValue !== 'object' || propsValue === null || !('url' in propsValue)) {
    return undefined;
  }
  const url: unknown = propsValue.url;
  if (typeof url === 'object' && url !== null && 'url' in url) {
    return url.url;
  }
  return url;
}

export { blueskyAuth } from './lib/common/auth';
export { createBlueskyAgent } from './lib/common/client';
