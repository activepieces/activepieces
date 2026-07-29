import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { publoraAuth } from './lib/auth';
import { PUBLORA_API_URL } from './lib/common/client';
import { createPostAction } from './lib/actions/create-post.action';
import { getPostStatusAction } from './lib/actions/get-post-status.action';
import { listConnectionsAction } from './lib/actions/list-connections.action';
import { newPublishedPostTrigger } from './lib/triggers/new-published-post.trigger';

export const publora = createPiece({
  displayName: 'Publora',
  description:
    'Publish and schedule posts to Instagram, TikTok, YouTube, Facebook, Threads, Bluesky, X, Mastodon, LinkedIn and Telegram.',
  auth: publoraAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/publora.png',
  authors: ['publora'],
  categories: [PieceCategory.MARKETING],
  actions: [
    createPostAction,
    getPostStatusAction,
    listConnectionsAction,
    createCustomApiCallAction({
      auth: publoraAuth,
      baseUrl: () => PUBLORA_API_URL,
      authMapping: async (auth) => {
        return {
          'x-publora-key': auth as string,
        };
      },
    }),
  ],
  triggers: [newPublishedPostTrigger],
});
