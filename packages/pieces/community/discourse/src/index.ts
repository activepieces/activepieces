import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addUsersToGroup } from './lib/actions/add-users-to-group.action';
import { changeUserTrustLevel } from './lib/actions/change-trust-level.action';
import { createPost } from './lib/actions/create-post.action';
import { createTopic } from './lib/actions/create-topic.action';
import { discourseCustomApiCall } from './lib/actions/custom-api-call';
import { sendPrivateMessage } from './lib/actions/send-private-message.action';
import { activateUserAction } from './lib/actions/ai/activate-user';
import { addGroupMembersAction } from './lib/actions/ai/add-group-members';
import { adminGetUserAction } from './lib/actions/ai/admin-get-user';
import { createCategoryAction } from './lib/actions/ai/create-category';
import { createGroupAction } from './lib/actions/ai/create-group';
import { createInviteAction } from './lib/actions/ai/create-invite';
import { createTopicAiAction } from './lib/actions/ai/create-topic-ai';
import { createUserAction } from './lib/actions/ai/create-user';
import { deactivateUserAction } from './lib/actions/ai/deactivate-user';
import { deletePostAction } from './lib/actions/ai/delete-post';
import { deleteTopicAction } from './lib/actions/ai/delete-topic';
import { getCategoryAction } from './lib/actions/ai/get-category';
import { getGroupAction } from './lib/actions/ai/get-group';
import { getNotificationsAction } from './lib/actions/ai/get-notifications';
import { getPostRepliesAction } from './lib/actions/ai/get-post-replies';
import { getPostAction } from './lib/actions/ai/get-post';
import { getSiteInfoAction } from './lib/actions/ai/get-site-info';
import { getTopicByExternalIdAction } from './lib/actions/ai/get-topic-by-external-id';
import { getTopicPostsAction } from './lib/actions/ai/get-topic-posts';
import { getTopicAction } from './lib/actions/ai/get-topic';
import { getUserByExternalIdAction } from './lib/actions/ai/get-user-by-external-id';
import { getUserAction } from './lib/actions/ai/get-user';
import { grantBadgeAction } from './lib/actions/ai/grant-badge';
import { inviteToTopicAction } from './lib/actions/ai/invite-to-topic';
import { likePostAction } from './lib/actions/ai/like-post';
import { listBadgesAction } from './lib/actions/ai/list-badges';
import { listCategoriesAction } from './lib/actions/ai/list-categories';
import { listCategoryTopicsAction } from './lib/actions/ai/list-category-topics';
import { listGroupMembersAction } from './lib/actions/ai/list-group-members';
import { listGroupsAction } from './lib/actions/ai/list-groups';
import { listLatestPostsAction } from './lib/actions/ai/list-latest-posts';
import { listLatestTopicsAction } from './lib/actions/ai/list-latest-topics';
import { listTagsAction } from './lib/actions/ai/list-tags';
import { listTopTopicsAction } from './lib/actions/ai/list-top-topics';
import { listUserActionsAction } from './lib/actions/ai/list-user-actions';
import { listUserBadgesAction } from './lib/actions/ai/list-user-badges';
import { listUserPrivateMessagesAction } from './lib/actions/ai/list-user-private-messages';
import { listUsersAction } from './lib/actions/ai/list-users';
import { logOutUserAction } from './lib/actions/ai/log-out-user';
import { removeGroupMembersAction } from './lib/actions/ai/remove-group-members';
import { replyToTopicAction } from './lib/actions/ai/reply-to-topic';
import { searchAction } from './lib/actions/ai/search';
import { setTopicStatusAction } from './lib/actions/ai/set-topic-status';
import { setUserTrustLevelAction } from './lib/actions/ai/set-user-trust-level';
import { silenceUserAction } from './lib/actions/ai/silence-user';
import { suspendUserAction } from './lib/actions/ai/suspend-user';
import { unsilenceUserAction } from './lib/actions/ai/unsilence-user';
import { unsuspendUserAction } from './lib/actions/ai/unsuspend-user';
import { updatePostAction } from './lib/actions/ai/update-post';
import { updateTopicAction } from './lib/actions/ai/update-topic';
import { updateUserAction } from './lib/actions/ai/update-user';
import { newPostTrigger } from './lib/triggers/new-post';
import { newTopicTrigger } from './lib/triggers/new-topic';
import { newUserTrigger } from './lib/triggers/new-user';
import { postEditedTrigger } from './lib/triggers/post-edited';
import { userAddedToGroupTrigger } from './lib/triggers/user-added-to-group';
import { discourseAuth } from './lib/auth';

export const discourse = createPiece({
  displayName: 'Discourse',
  description: 'Modern open source forum software',
  auth: discourseAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/discourse.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['pfernandez98', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createPost,
    createTopic,
    changeUserTrustLevel,
    addUsersToGroup,
    sendPrivateMessage,
    activateUserAction,
    addGroupMembersAction,
    adminGetUserAction,
    createCategoryAction,
    createGroupAction,
    createInviteAction,
    createTopicAiAction,
    createUserAction,
    deactivateUserAction,
    deletePostAction,
    deleteTopicAction,
    getCategoryAction,
    getGroupAction,
    getNotificationsAction,
    getPostRepliesAction,
    getPostAction,
    getSiteInfoAction,
    getTopicByExternalIdAction,
    getTopicPostsAction,
    getTopicAction,
    getUserByExternalIdAction,
    getUserAction,
    grantBadgeAction,
    inviteToTopicAction,
    likePostAction,
    listBadgesAction,
    listCategoriesAction,
    listCategoryTopicsAction,
    listGroupMembersAction,
    listGroupsAction,
    listLatestPostsAction,
    listLatestTopicsAction,
    listTagsAction,
    listTopTopicsAction,
    listUserActionsAction,
    listUserBadgesAction,
    listUserPrivateMessagesAction,
    listUsersAction,
    logOutUserAction,
    removeGroupMembersAction,
    replyToTopicAction,
    searchAction,
    setTopicStatusAction,
    setUserTrustLevelAction,
    silenceUserAction,
    suspendUserAction,
    unsilenceUserAction,
    unsuspendUserAction,
    updatePostAction,
    updateTopicAction,
    updateUserAction,
    discourseCustomApiCall,
  ],
  triggers: [
    newPostTrigger,
    newTopicTrigger,
    newUserTrigger,
    postEditedTrigger,
    userAddedToGroupTrigger,
  ],
});
