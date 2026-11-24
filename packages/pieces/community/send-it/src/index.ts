import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sendItAuth } from './lib/common/auth';
import { BASE_URL, apiKeyOf, authHeaders } from './lib/common/client';
import { publishPost } from './lib/actions/publish-post';
import { schedulePost } from './lib/actions/schedule-post';
import { cancelScheduledPost } from './lib/actions/cancel-scheduled-post';
import { triggerScheduledPost } from './lib/actions/trigger-scheduled-post';
import { validateContent } from './lib/actions/validate-content';
import { listAccounts } from './lib/actions/list-accounts';
import { listScheduledPosts } from './lib/actions/list-scheduled-posts';
import { getPostAnalytics } from './lib/actions/get-post-analytics';
import { listFailedPosts } from './lib/actions/list-failed-posts';
import { cancelScheduledPostById } from './lib/actions/ai/cancel-scheduled-post-by-id';
import { publishScheduledPostNow } from './lib/actions/ai/publish-scheduled-post-now';
import { getScheduledPost } from './lib/actions/ai/get-scheduled-post';
import { getPlatformRequirements } from './lib/actions/ai/get-platform-requirements';
import { postPublished } from './lib/triggers/post-published';
import { postScheduled } from './lib/triggers/post-scheduled';
import { postFailed } from './lib/triggers/post-failed';

export const sendIt = createPiece({
  displayName: 'SendIt',
  description:
    'Multi-platform social media publishing. Schedule and publish content to LinkedIn, Instagram, Threads, TikTok, X, and 30+ more platforms.',
  auth: sendItAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/send-it.png',
  categories: [PieceCategory.MARKETING],
  authors: ['infiniteappsai', 'sanket-a11y', 'OdaiAhmed99'],
  actions: [
    publishPost,
    schedulePost,
    cancelScheduledPost,
    triggerScheduledPost,
    validateContent,
    listAccounts,
    listScheduledPosts,
    getPostAnalytics,
    listFailedPosts,
    cancelScheduledPostById,
    publishScheduledPostNow,
    getScheduledPost,
    getPlatformRequirements,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: sendItAuth,
      authMapping: async (auth) => authHeaders(apiKeyOf(auth)),
    }),
  ],
  triggers: [postPublished, postScheduled, postFailed],
});
