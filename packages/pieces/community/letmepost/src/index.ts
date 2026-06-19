import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { letmepostAuth } from './lib/common/auth';
import { publishPost } from './lib/actions/publish-post';
import { getPost } from './lib/actions/get-post';
import { listAccounts } from './lib/actions/list-accounts';
import { listMedia } from './lib/actions/list-media';
import { newPublishedPost } from './lib/triggers/new-published-post';
import { postEvent } from './lib/triggers/post-event';

export const letmepost = createPiece({
  displayName: 'Letmepost',
  description:
    'Publish and schedule posts to Bluesky, X, LinkedIn, Instagram, Threads, Facebook, Pinterest, and TikTok through one API',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/letmepost.png',
  categories: [PieceCategory.MARKETING],
  auth: letmepostAuth,
  authors: ['rosekamallove', 'sanket-a11y'],
  actions: [
    publishPost,
    getPost,
    listAccounts,
    listMedia,
    createCustomApiCallAction({
      baseUrl: (auth) => auth?.props.base_url ?? 'https://api.letmepost.dev',
      auth: letmepostAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key}`,
      }),
    }),
  ],
  triggers: [newPublishedPost, postEvent],
});
