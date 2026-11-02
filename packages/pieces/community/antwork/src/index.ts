import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { antworkAuth, ANTWORK_API_BASE } from './lib/auth';
import { createDraftPost } from './lib/actions/create-draft-post';
import { schedulePost } from './lib/actions/schedule-post';
import { publishPost } from './lib/actions/publish-post';
import { getPost } from './lib/actions/get-post';
import { newPublishedPost } from './lib/triggers/new-published-post';

export const antwork = createPiece({
  displayName: 'Antwork',
  description:
    'AI social media manager: draft, schedule and publish posts to LinkedIn, Instagram, X, TikTok, YouTube, Threads, Facebook, Bluesky, Pinterest, Mastodon, Telegram and Discord.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/antwork.png',
  categories: [PieceCategory.MARKETING],
  auth: antworkAuth,
  authors: ['iker-gonzalez'],
  actions: [
    createDraftPost,
    schedulePost,
    publishPost,
    getPost,
    createCustomApiCallAction({
      baseUrl: () => ANTWORK_API_BASE,
      auth: antworkAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      }),
    }),
  ],
  triggers: [newPublishedPost],
});
