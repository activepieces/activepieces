import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { sendItAuth } from './lib/auth';
import { publishPost } from './lib/actions/publish-post';
import { schedulePost } from './lib/actions/schedule-post';
import { cancelScheduledPost } from './lib/actions/cancel-scheduled-post';
import { triggerScheduledPost } from './lib/actions/trigger-scheduled-post';
import { validateContent } from './lib/actions/validate-content';
import { listAccounts } from './lib/actions/list-accounts';
import { listScheduledPosts } from './lib/actions/list-scheduled-posts';
import { postPublished } from './lib/triggers/post-published';
import { postScheduled } from './lib/triggers/post-scheduled';
import { postFailed } from './lib/triggers/post-failed';
import { BASE_URL } from './lib/common';

export const sendIt = createPiece({
  displayName: 'SendIt',
  description:
    'Multi-platform social media publishing. Schedule and publish content to LinkedIn, Instagram, Threads, TikTok, X, and 30+ more platforms.',
  auth: sendItAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/send-it.png',
  categories: [PieceCategory.MARKETING],
  authors: ['infiniteappsai', 'sanket-a11y'],
  actions: [
    publishPost,
    schedulePost,
    cancelScheduledPost,
    triggerScheduledPost,
    validateContent,
    listAccounts,
    listScheduledPosts,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: sendItAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [postPublished, postScheduled, postFailed],
});
