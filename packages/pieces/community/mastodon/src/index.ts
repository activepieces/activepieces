import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { postStatus } from './lib/actions/post-status';
import { createStatus } from './lib/actions/create-status';
import { scheduleStatus } from './lib/actions/schedule-status';
import { getStatus } from './lib/actions/get-status';
import { editStatus } from './lib/actions/edit-status';
import { deleteStatus } from './lib/actions/delete-status';
import { getStatusContext } from './lib/actions/get-status-context';
import { listStatusBoostedBy } from './lib/actions/list-status-boosted-by';
import { listStatusFavouritedBy } from './lib/actions/list-status-favourited-by';
import { favouriteStatus } from './lib/actions/favourite-status';
import { unfavouriteStatus } from './lib/actions/unfavourite-status';
import { boostStatus } from './lib/actions/boost-status';
import { unboostStatus } from './lib/actions/unboost-status';
import { bookmarkStatus } from './lib/actions/bookmark-status';
import { unbookmarkStatus } from './lib/actions/unbookmark-status';
import { muteConversation } from './lib/actions/mute-conversation';
import { unmuteConversation } from './lib/actions/unmute-conversation';
import { pinStatus } from './lib/actions/pin-status';
import { unpinStatus } from './lib/actions/unpin-status';
import { listScheduledStatuses } from './lib/actions/list-scheduled-statuses';
import { getScheduledStatus } from './lib/actions/get-scheduled-status';
import { rescheduleStatus } from './lib/actions/reschedule-status';
import { cancelScheduledStatus } from './lib/actions/cancel-scheduled-status';
import { uploadMedia } from './lib/actions/upload-media';
import { getMedia } from './lib/actions/get-media';
import { updateMedia } from './lib/actions/update-media';
import { deleteMedia } from './lib/actions/delete-media';
import { getMyAccount } from './lib/actions/get-my-account';
import { updateMyProfile } from './lib/actions/update-my-profile';
import { getAccount } from './lib/actions/get-account';
import { lookupAccount } from './lib/actions/lookup-account';
import { searchAccounts } from './lib/actions/search-accounts';
import { listAccountStatuses } from './lib/actions/list-account-statuses';
import { listAccountFollowers } from './lib/actions/list-account-followers';
import { listAccountFollowing } from './lib/actions/list-account-following';
import { getRelationships } from './lib/actions/get-relationships';
import { followAccount } from './lib/actions/follow-account';
import { unfollowAccount } from './lib/actions/unfollow-account';
import { blockAccount } from './lib/actions/block-account';
import { unblockAccount } from './lib/actions/unblock-account';
import { muteAccount } from './lib/actions/mute-account';
import { unmuteAccount } from './lib/actions/unmute-account';
import { listBlockedAccounts } from './lib/actions/list-blocked-accounts';
import { listMutedAccounts } from './lib/actions/list-muted-accounts';
import { listFollowRequests } from './lib/actions/list-follow-requests';
import { acceptFollowRequest } from './lib/actions/accept-follow-request';
import { rejectFollowRequest } from './lib/actions/reject-follow-request';
import { listBookmarks } from './lib/actions/list-bookmarks';
import { listFavourites } from './lib/actions/list-favourites';
import { getHomeTimeline } from './lib/actions/get-home-timeline';
import { getPublicTimeline } from './lib/actions/get-public-timeline';
import { getHashtagTimeline } from './lib/actions/get-hashtag-timeline';
import { getListTimeline } from './lib/actions/get-list-timeline';
import { listNotifications } from './lib/actions/list-notifications';
import { getNotification } from './lib/actions/get-notification';
import { dismissNotification } from './lib/actions/dismiss-notification';
import { clearNotifications } from './lib/actions/clear-notifications';
import { getUnreadNotificationCount } from './lib/actions/get-unread-notification-count';
import { search } from './lib/actions/search';
import { listLists } from './lib/actions/list-lists';
import { getList } from './lib/actions/get-list';
import { createList } from './lib/actions/create-list';
import { updateList } from './lib/actions/update-list';
import { deleteList } from './lib/actions/delete-list';
import { listListAccounts } from './lib/actions/list-list-accounts';
import { addAccountsToList } from './lib/actions/add-accounts-to-list';
import { removeAccountsFromList } from './lib/actions/remove-accounts-from-list';
import { getPoll } from './lib/actions/get-poll';
import { voteInPoll } from './lib/actions/vote-in-poll';
import { listConversations } from './lib/actions/list-conversations';
import { markConversationRead } from './lib/actions/mark-conversation-read';
import { deleteConversation } from './lib/actions/delete-conversation';
import { getTag } from './lib/actions/get-tag';
import { followTag } from './lib/actions/follow-tag';
import { unfollowTag } from './lib/actions/unfollow-tag';
import { listFollowedTags } from './lib/actions/list-followed-tags';
import { listFilters } from './lib/actions/list-filters';
import { getFilter } from './lib/actions/get-filter';
import { createFilter } from './lib/actions/create-filter';
import { updateFilter } from './lib/actions/update-filter';
import { deleteFilter } from './lib/actions/delete-filter';
import { getTrendingTags } from './lib/actions/get-trending-tags';
import { getTrendingStatuses } from './lib/actions/get-trending-statuses';
import { getTrendingLinks } from './lib/actions/get-trending-links';
import { getInstanceInfo } from './lib/actions/get-instance-info';

const markdownDescription = `
**Base Url**: The base url of your Mastodon instance (e.g \`https://mastodon.social\`)

**Access Token**: To get your access token, follow the steps below:

1. Go to your **Profile** -> **Preferences** -> **Development** -> **New Application**
2. Fill the Information
3. Under **Scopes**, tick **read** and **write** (the form pre-selects only \`profile\`)
4. Click on **Create Application**
5. Copy access token from **Your access token**

If an existing connection fails with a missing-scope error, edit the application in Mastodon, tick **read** and **write**, save (this regenerates the token) and paste the new token here.
`;

export const mastodonAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL of your Mastodon instance',
      defaultValue: 'https://mastodon.social/',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'Access Token',
      description:
        'The access token for your Mastodon account, check the documentation for how to get this',
      required: true,
    }),
  },
  required: true,
});

export const mastodon = createPiece({
  displayName: 'Mastodon',
  description: 'Open-source decentralized social network',

  logoUrl: 'https://cdn.activepieces.com/pieces/mastodon.png',
  categories: [PieceCategory.COMMUNICATION],
  minimumSupportedRelease: '0.87.0',
  authors: ["denieler","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: mastodonAuth,
  actions: [
    postStatus,
    createStatus,
    scheduleStatus,
    getStatus,
    editStatus,
    deleteStatus,
    getStatusContext,
    listStatusBoostedBy,
    listStatusFavouritedBy,
    favouriteStatus,
    unfavouriteStatus,
    boostStatus,
    unboostStatus,
    bookmarkStatus,
    unbookmarkStatus,
    muteConversation,
    unmuteConversation,
    pinStatus,
    unpinStatus,
    listScheduledStatuses,
    getScheduledStatus,
    rescheduleStatus,
    cancelScheduledStatus,
    uploadMedia,
    getMedia,
    updateMedia,
    deleteMedia,
    getMyAccount,
    updateMyProfile,
    getAccount,
    lookupAccount,
    searchAccounts,
    listAccountStatuses,
    listAccountFollowers,
    listAccountFollowing,
    getRelationships,
    followAccount,
    unfollowAccount,
    blockAccount,
    unblockAccount,
    muteAccount,
    unmuteAccount,
    listBlockedAccounts,
    listMutedAccounts,
    listFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    listBookmarks,
    listFavourites,
    getHomeTimeline,
    getPublicTimeline,
    getHashtagTimeline,
    getListTimeline,
    listNotifications,
    getNotification,
    dismissNotification,
    clearNotifications,
    getUnreadNotificationCount,
    search,
    listLists,
    getList,
    createList,
    updateList,
    deleteList,
    listListAccounts,
    addAccountsToList,
    removeAccountsFromList,
    getPoll,
    voteInPoll,
    listConversations,
    markConversationRead,
    deleteConversation,
    getTag,
    followTag,
    unfollowTag,
    listFollowedTags,
    listFilters,
    getFilter,
    createFilter,
    updateFilter,
    deleteFilter,
    getTrendingTags,
    getTrendingStatuses,
    getTrendingLinks,
    getInstanceInfo,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth?.props?.base_url.replace(/\/$/, '') + '/api/v1',
      auth: mastodonAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth ).props .access_token
        }`,
      }),
    }),
  ],
  triggers: [],
});
