import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
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

export const sendItAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your SendIt API key (starts with sk_live_). Get it from your SendIt Dashboard.',
  required: true,
});

export const sendIt = createPiece({
  displayName: 'SendIt',
  description: 'Multi-platform social media publishing. Schedule and publish content to LinkedIn, Instagram, Threads, TikTok, and X.',
  auth: sendItAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://sendit.infiniteappsai.com/logo.png',
  authors: ['infiniteappsai'],
  actions: [
    publishPost,
    schedulePost,
    cancelScheduledPost,
    triggerScheduledPost,
    validateContent,
    listAccounts,
    listScheduledPosts,
  ],
  triggers: [
    postPublished,
    postScheduled,
    postFailed,
  ],
});
