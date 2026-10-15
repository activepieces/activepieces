import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { retrieveRedditPost } from './lib/actions/retrieve-reddit-post';
import { getRedditPostDetails } from './lib/actions/get-reddit-post-details';
import { createRedditPost } from './lib/actions/create-reddit-post';
import { createRedditComment } from './lib/actions/create-reddit-comment';
import { fetchPostComments} from './lib/actions/fetch-post-comments';
import { editRedditPost } from './lib/actions/edit-reddit-post';
import { editRedditComment } from './lib/actions/edit-reddit-comment';
import { deleteRedditPost } from './lib/actions/delete-reddit-post';
import { deleteRedditComment } from './lib/actions/delete-reddit-comment';
import { PieceCategory } from '@activepieces/pieces-framework';
import { redditAuth } from './lib/auth';
import { redditCreateComment } from './lib/actions/ai/create-comment';
import { redditCreatePost } from './lib/actions/ai/create-post';
import { redditCrosspost } from './lib/actions/ai/crosspost';
import { redditDeleteComment } from './lib/actions/ai/delete-comment';
import { redditDeleteMessage } from './lib/actions/ai/delete-message';
import { redditDeletePost } from './lib/actions/ai/delete-post';
import { redditEditText } from './lib/actions/ai/edit-text';
import { redditExpandMoreComments } from './lib/actions/ai/expand-more-comments';
import { redditGetContent } from './lib/actions/ai/get-content';
import { redditGetMe } from './lib/actions/ai/get-me';
import { redditGetMyKarma } from './lib/actions/ai/get-my-karma';
import { redditGetMyPreferences } from './lib/actions/ai/get-my-preferences';
import { redditGetPostRequirements } from './lib/actions/ai/get-post-requirements';
import { redditGetSubmitText } from './lib/actions/ai/get-submit-text';
import { redditGetSubredditRules } from './lib/actions/ai/get-subreddit-rules';
import { redditGetSubreddit } from './lib/actions/ai/get-subreddit';
import { redditGetUserTrophies } from './lib/actions/ai/get-user-trophies';
import { redditGetUser } from './lib/actions/ai/get-user';
import { redditGetWikiPage } from './lib/actions/ai/get-wiki-page';
import { redditHidePost } from './lib/actions/ai/hide-post';
import { redditListDuplicates } from './lib/actions/ai/list-duplicates';
import { redditListMessages } from './lib/actions/ai/list-messages';
import { redditListMySubreddits } from './lib/actions/ai/list-my-subreddits';
import { redditListPostComments } from './lib/actions/ai/list-post-comments';
import { redditListPostFlairs } from './lib/actions/ai/list-post-flairs';
import { redditListPosts } from './lib/actions/ai/list-posts';
import { redditListSavedCategories } from './lib/actions/ai/list-saved-categories';
import { redditListSubredditComments } from './lib/actions/ai/list-subreddit-comments';
import { redditListSubredditModerators } from './lib/actions/ai/list-subreddit-moderators';
import { redditListSubreddits } from './lib/actions/ai/list-subreddits';
import { redditListUserContent } from './lib/actions/ai/list-user-content';
import { redditListUserFlairs } from './lib/actions/ai/list-user-flairs';
import { redditListWikiPages } from './lib/actions/ai/list-wiki-pages';
import { redditMarkAllMessagesRead } from './lib/actions/ai/mark-all-messages-read';
import { redditMarkMessageRead } from './lib/actions/ai/mark-message-read';
import { redditReportContent } from './lib/actions/ai/report-content';
import { redditSaveContent } from './lib/actions/ai/save-content';
import { redditSearchPosts } from './lib/actions/ai/search-posts';
import { redditSearchSubreddits } from './lib/actions/ai/search-subreddits';
import { redditSearchUsers } from './lib/actions/ai/search-users';
import { redditSendMessage } from './lib/actions/ai/send-message';
import { redditSetInboxReplies } from './lib/actions/ai/set-inbox-replies';
import { redditSetPostFlair } from './lib/actions/ai/set-post-flair';
import { redditSubscribeSubreddit } from './lib/actions/ai/subscribe-subreddit';
import { redditUnhidePost } from './lib/actions/ai/unhide-post';
import { redditUnsaveContent } from './lib/actions/ai/unsave-content';
import { redditUnsubscribeSubreddit } from './lib/actions/ai/unsubscribe-subreddit';


export const reddit = createPiece({
  displayName: 'Reddit',
  description: 'Interact with Reddit - fetch and submit posts.',
  logoUrl: 'https://cdn.activepieces.com/pieces/reddit.png',
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['bhaviksingla1403'],
  auth: redditAuth,
  actions: [
    retrieveRedditPost,
    getRedditPostDetails,
    createRedditPost,
    createRedditComment,
    fetchPostComments,
    editRedditPost,
    editRedditComment,
    deleteRedditPost,
    deleteRedditComment,
    redditCreateComment,
    redditCreatePost,
    redditCrosspost,
    redditDeleteComment,
    redditDeleteMessage,
    redditDeletePost,
    redditEditText,
    redditExpandMoreComments,
    redditGetContent,
    redditGetMe,
    redditGetMyKarma,
    redditGetMyPreferences,
    redditGetPostRequirements,
    redditGetSubmitText,
    redditGetSubredditRules,
    redditGetSubreddit,
    redditGetUserTrophies,
    redditGetUser,
    redditGetWikiPage,
    redditHidePost,
    redditListDuplicates,
    redditListMessages,
    redditListMySubreddits,
    redditListPostComments,
    redditListPostFlairs,
    redditListPosts,
    redditListSavedCategories,
    redditListSubredditComments,
    redditListSubredditModerators,
    redditListSubreddits,
    redditListUserContent,
    redditListUserFlairs,
    redditListWikiPages,
    redditMarkAllMessagesRead,
    redditMarkMessageRead,
    redditReportContent,
    redditSaveContent,
    redditSearchPosts,
    redditSearchSubreddits,
    redditSearchUsers,
    redditSendMessage,
    redditSetInboxReplies,
    redditSetPostFlair,
    redditSubscribeSubreddit,
    redditUnhidePost,
    redditUnsaveContent,
    redditUnsubscribeSubreddit,
    createCustomApiCallAction({
      auth: redditAuth,
      baseUrl: () => {
        return 'https://oauth.reddit.com';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          'User-Agent': 'ActivePieces/1.0.0'
        };
      },
    }),
  ],
  triggers: [],
});
